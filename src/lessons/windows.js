// Ruta «Windows y PowerShell»: de los primeros cmdlets a administrar un
// controlador de dominio, sobre el PowerShell simulado de
// engine/powershell/ps.js. Los objetivos miran el estado del equipo
// (ps.state) y lo que se ha ejecutado (ps.log, con los parámetros ya
// asociados a su nombre completo: -Rec cuenta como -Recurse).

import { psNode, replicationOk } from '../engine/powershell/ps.js';

// Algún cmdlet o programa ejecutado (con éxito, si ok) cumple el predicado.
const psRan = (name, pred = () => true, { ok = false } = {}) => (ps) =>
  ps.log.some((e) => (!ok || e.ok) && e.cmds.some((c) => c.name.toLowerCase() === name.toLowerCase() && pred(c)));
const args = (c) => (c.args ?? []).join(' ').toLowerCase();
const all = (...fns) => (ps) => fns.every((f) => f(ps));
const any = (...fns) => (ps) => fns.some((f) => f(ps));
const exists = (path, type) => (ps) => {
  const n = psNode(ps, path);
  return Boolean(n) && (!type || n.type === type);
};
const missing = (path) => (ps) => !psNode(ps, path);
const rule = (pred) => (ps) => ps.state.firewall.rules.some(pred);

const WIN11 = { os: 'win11' };

const SERVER_DC = (st) => {
  st.ad.role = 'dc';
  for (const f of ['AD-Domain-Services', 'RSAT-ADDS', 'DNS', 'RSAT-DNS-Server']) st.features[f].installed = true;
  st.services.NTDS = { display: 'Servicios de dominio de Active Directory', status: 'Running' };
  st.services.Netlogon = { display: 'Net Logon', status: 'Running' };
  st.services.DFSR = { display: 'Replicación DFS', status: 'Running' };
  st.services.DNS = { display: 'Servidor DNS', status: 'Stopped' };
  st.ad.replication.broken = true;
};

export const windows = [
  {
    id: 'win-basico',
    type: 'powershell',
    title: 'PowerShell desde cero',
    summary: 'Cmdlets Verbo-Sustantivo, Get-Help, Get-Command, alias y tus primeras carpetas.',
    exam: ['tai2025X-S2-20', 'tai2022-S2-2'],
    body: `**PowerShell** es la consola de administración de Windows. A diferencia de la vieja \`cmd\`, sus órdenes, los **cmdlets**, tienen nombres largos y **predecibles**: **Verbo-Sustantivo**.

| Verbo | Para… | Ejemplos |
|---|---|---|
| \`Get\` | consultar | \`Get-ChildItem\`, \`Get-Service\` |
| \`Set\` | cambiar | \`Set-Location\`, \`Set-Content\` |
| \`New\` / \`Remove\` | crear / borrar | \`New-Item\`, \`Remove-Item\` |
| \`Copy\` / \`Move\` | copiar / mover | \`Copy-Item\`, \`Move-Item\` |
| \`Install\` / \`Start\` | instalar / arrancar | \`Install-WindowsFeature\`, \`Start-Service\` |

Los **parámetros** van con un guion: \`-Path\`, \`-Recurse\`… No distinguen mayúsculas y se pueden **abreviar** mientras no haya ambigüedad (\`-Rec\` = \`-Recurse\`).

Para no aprenderse nada de memoria:
- \`Get-Help Copy-Item\` explica un cmdlet; con \`-Examples\`, solo los ejemplos.
- \`Get-Command *-Item\` busca cmdlets con comodines.
- Muchos tienen **alias**: \`ls\` y \`dir\` son \`Get-ChildItem\`; \`cd\` es \`Set-Location\`; \`cat\` es \`Get-Content\`. \`Get-Alias\` los lista.

Para crear: \`New-Item -Path Informes -ItemType Directory\` (una carpeta) o \`New-Item -Path notas.txt -ItemType File -Value "texto"\` (un fichero con contenido).`,
    setup: WIN11,
    objectives: [
      { label: 'Muestra en qué carpeta estás con Get-Location', check: psRan('Get-Location') },
      { label: 'Lista su contenido con Get-ChildItem', check: psRan('Get-ChildItem') },
      { label: 'Crea la carpeta Informes en tu carpeta personal', check: exists('C:\\Users\\alumno\\Informes', 'dir') },
      { label: 'Crea dentro el fichero notas.txt con el texto «Oposición TAI»', check: (ps) => /oposición tai/i.test(psNode(ps, 'C:\\Users\\alumno\\Informes\\notas.txt')?.content ?? '') },
      { label: 'Busca todos los cmdlets cuyo sustantivo es Item', check: psRan('Get-Command', (c) => /item/i.test(`${c.params.Name ?? ''} ${c.params.Noun ?? ''}`)) },
      { label: 'Descubre qué cmdlet se esconde detrás del alias ls', check: any(psRan('Get-Alias', (c) => /ls/i.test(c.params.Name ?? '')), psRan('Get-Help', (c) => /^ls$/i.test(c.params.Name ?? '')), psRan('Get-Command', (c) => /^ls$/i.test(c.params.Name ?? ''))) },
    ],
    hints: [
      'Get-Location',
      'Get-ChildItem (o su alias ls)',
      'New-Item -Path Informes -ItemType Directory',
      'New-Item -Path Informes\\notas.txt -ItemType File -Value "Oposición TAI"',
      'Get-Command *-Item (o Get-Command -Noun Item)',
      'Get-Alias ls',
    ],
    curiosity: 'Por dentro, PowerShell no pasa texto de una orden a otra, sino objetos .NET con propiedades. Por eso «Get-Service | Where-Object Status -eq Running» funciona sin recortar columnas como harías con grep y awk.',
  },
  {
    id: 'win-copiar',
    type: 'powershell',
    title: 'Copiar carpetas con Copy-Item',
    summary: '-Path, -Destination y -Recurse (no -Recursive): copiar el contenido o la carpeta (examen 2025).',
    body: `Te piden copiar **todo el contenido** de \`C:\\DirectorioA\` en \`C:\\DirectorioB\`, que **ya existe**, de forma **recursiva**. Es la pregunta 20 del supuesto II de 2025.

\`\`\`
Copy-Item -Path "C:\\DirectorioA\\*" -Destination "C:\\DirectorioB" -Recurse
\`\`\`

Tres detalles que decide el examen:
1. El cmdlet es **Copy-Item** (no existe *Copy-Path*).
2. El modificador es **-Recurse**. *-Recursive* no existe y da error; compruébalo.
3. **El asterisco importa**:
   - \`C:\\DirectorioA\\*\` copia **lo que hay dentro** de A directamente en B.
   - \`C:\\DirectorioA\` (sin \`\\*\`) copia **la carpeta A entera**: acabarías con \`C:\\DirectorioB\\DirectorioA\\…\`.

Sin \`-Recurse\`, Copy-Item crea las subcarpetas **vacías**: no entra en ellas.

\`-Path\` y \`-Destination\` son **posicionales**: \`Copy-Item "C:\\A\\*" "C:\\B" -Recurse\` también vale. Pero escribir el nombre de cada parámetro es más claro, y así aparece en la respuesta correcta.`,
    setup: {
      ...WIN11,
      files: {
        'C:\\DirectorioA\\acta.txt': 'Acta de la reunión del 3 de noviembre.\n',
        'C:\\DirectorioA\\presupuesto.xlsx': { content: '(hoja de cálculo)', size: 18432 },
        'C:\\DirectorioA\\Informes\\2025\\memoria.docx': { content: '(documento)', size: 40960 },
        'C:\\DirectorioA\\Informes\\2026\\memoria.docx': { content: '(documento)', size: 52224 },
        'C:\\DirectorioB\\LEEME.txt': 'Carpeta de destino de la copia.\n',
      },
    },
    objectives: [
      { label: 'Consulta la ayuda de Copy-Item', check: psRan('Get-Help', (c) => /^(copy-item|cp|copy|cpi)$/i.test(c.params.Name ?? '')) },
      { label: 'Mira todo lo que hay en C:\\DirectorioA, subcarpetas incluidas', check: psRan('Get-ChildItem', (c) => c.params.Recurse && /directorioa/i.test(c.params.Path ?? '')) },
      {
        label: 'Copia todo el contenido de A dentro de B, subcarpetas incluidas',
        check: all(exists('C:\\DirectorioB\\acta.txt', 'file'), exists('C:\\DirectorioB\\Informes\\2026\\memoria.docx', 'file'), exists('C:\\DirectorioB\\Informes\\2025\\memoria.docx', 'file'), missing('C:\\DirectorioB\\DirectorioA')),
      },
      {
        label: 'Comprueba el resultado listando C:\\DirectorioB de forma recursiva',
        check: all(exists('C:\\DirectorioB\\Informes\\2026\\memoria.docx'), (ps) => {
          const e = ps.log.at(-1);
          return e?.cmds.some((c) => c.name === 'Get-ChildItem' && c.params.Recurse && /directoriob/i.test(c.params.Path ?? ''));
        }),
      },
    ],
    hints: [
      'Get-Help Copy-Item (o Get-Help Copy-Item -Examples)',
      'Get-ChildItem C:\\DirectorioA -Recurse',
      'Copy-Item -Path "C:\\DirectorioA\\*" -Destination "C:\\DirectorioB" -Recurse   (si copiaste la carpeta entera, bórrala: Remove-Item C:\\DirectorioB\\DirectorioA -Recurse)',
      'Get-ChildItem C:\\DirectorioB -Recurse',
    ],
    curiosity: 'En cmd, lo mismo se hace con «xcopy C:\\DirectorioA C:\\DirectorioB /E /I» o, mejor, «robocopy C:\\DirectorioA C:\\DirectorioB /E», que además reintenta si falla la red y puede reanudar copias a medias.',
    exam: ['tai2025A-S2-20'],
  },
  {
    id: 'win-firewall',
    type: 'powershell',
    title: 'El Firewall de Windows: netsh y New-NetFirewallRule',
    summary: 'Consola de administrador, netsh advfirewall firewall add rule y su equivalente en PowerShell (examen 2025).',
    body: `En un **Windows 11** de la red de usuarios hay que permitir conexiones **entrantes TCP al puerto 8443** con una regla llamada **Puerto8443**.

## Primero, una consola de administrador
Cambiar el cortafuegos exige **elevación**. En Windows no hay \`sudo\`: se abre otra consola «como administrador» (clic derecho → *Ejecutar como administrador*, o):
\`\`\`
Start-Process powershell -Verb RunAs
\`\`\`
Sale el aviso del **Control de cuentas de usuario** (UAC) y, en la consola nueva, el título empieza por «Administrador:».

## Con netsh (vale en cmd y en PowerShell)
\`\`\`
netsh advfirewall firewall add rule name="Puerto8443" dir=in action=allow protocol=TCP localport=8443
\`\`\`
Fíjate bien: contexto **advfirewall firewall**, verbo **add rule** (no *create* ni *set*), **dir=in** y **action=allow** (no *permit*). \`netsh firewall\`, sin *adv*, es el contexto antiguo y está en desuso. Para comprobarlo: \`netsh advfirewall firewall show rule name="Puerto8443"\`.

## Con PowerShell
\`\`\`
New-NetFirewallRule -DisplayName "Puerto8443" -Direction Inbound -Protocol TCP -LocalPort 8443 -Action Allow
\`\`\`
Es lo mismo con nombres más claros: **-Direction** Inbound/Outbound y **-Action** Allow/Block. Para las conexiones **salientes** se filtra por el puerto **remoto** (\`-RemotePort\`).

\`Test-NetConnection equipo -Port N\` comprueba si un puerto TCP responde: es el \`nc -vz\` de Windows.`,
    setup: WIN11,
    objectives: [
      { label: 'Consulta el estado del cortafuegos en todos los perfiles', check: psRan('netsh', (c) => args(c).includes('show allprofiles')) },
      { label: 'Abre una consola de PowerShell como administrador', check: (ps) => ps.state.elevated },
      { label: 'Crea con netsh la regla Puerto8443: TCP entrante al 8443, permitido', check: rule((r) => r.via === 'netsh' && r.name.toLowerCase() === 'puerto8443' && r.dir === 'in' && r.action === 'allow' && r.protocol === 'TCP' && r.localport === '8443') },
      { label: 'Compruébala con netsh', check: all(rule((r) => r.name.toLowerCase() === 'puerto8443'), psRan('netsh', (c) => /show rule name=(puerto8443|all)/.test(args(c)))) },
      { label: 'Con New-NetFirewallRule, bloquea las conexiones salientes a Telnet (TCP 23)', check: rule((r) => r.via === 'powershell' && r.dir === 'out' && r.action === 'block' && r.protocol === 'TCP' && String(r.remoteport) === '23') },
      { label: 'Comprueba con Test-NetConnection que llegas al puerto 3306 de db01', check: psRan('Test-NetConnection', (c) => c.params.Port === '3306' && /db01|10\.30\.20\.30/i.test(c.params.ComputerName ?? '')) },
    ],
    hints: [
      'netsh advfirewall show allprofiles',
      'Start-Process powershell -Verb RunAs',
      'netsh advfirewall firewall add rule name="Puerto8443" dir=in action=allow protocol=TCP localport=8443',
      'netsh advfirewall firewall show rule name="Puerto8443"',
      'New-NetFirewallRule -DisplayName "Bloquear-Telnet" -Direction Outbound -Protocol TCP -RemotePort 23 -Action Block',
      'Test-NetConnection db01 -Port 3306',
    ],
    curiosity: 'El Firewall de Windows Defender tiene tres perfiles: Dominio (cuando el equipo ve a su controlador de dominio), Privado y Público. Una regla puede aplicarse a uno, a varios o a todos (profile=any).',
    exam: ['tai2025A-S2R3', 'tai2025X-S2-4', 'tai2025X-S2-5', 'tai2019-S2-17', 'tai2019-S2R1'],
  },
  {
    id: 'win-ad',
    type: 'concept',
    title: 'Active Directory en lo esencial',
    summary: 'Dominio, controlador de dominio, OU, GPO, PSO, FSMO y las consolas que hay que reconocer.',
    body: `**Active Directory** (AD, o AD DS: *Active Directory Domain Services*) es el **directorio** de una organización Windows: una base de datos con los usuarios, grupos y equipos, y el sistema que los **autentica** (con **Kerberos**) y les aplica políticas.

## Las piezas
- **Dominio**: la unidad de administración, con nombre DNS (\`tai.local\`). Varios dominios forman un **árbol**, y varios árboles un **bosque**.
- **Controlador de dominio (DC)**: un Windows Server que guarda una copia del directorio y atiende los inicios de sesión. Lo normal es tener **al menos dos**, que **replican** los cambios entre sí.
- **Unidad organizativa (OU)**: una «carpeta» del dominio para ordenar objetos y **delegar** su administración. **A las OU se vinculan las GPO.**
- **Grupos**: sirven para dar **permisos**. Por ámbito: *de dominio local*, *global* y *universal*.

## Directivas de grupo (GPO)
Una **GPO** es un paquete de configuración (contraseñas, fondo de escritorio, scripts, restricciones…). Se **vincula** a un sitio, a un dominio o a una **OU**, y afecta a lo que contiene. No se vinculan a grupos: si quieres aplicarla a «Profesores», la buena práctica es crear **primero una OU** para ellos (o filtrar la GPO por grupo de seguridad). \`gpupdate /force\` fuerza a aplicarlas ya.

## Contraseñas distintas en un mismo dominio
La directiva de contraseñas de dominio es **una sola**. Para que, por ejemplo, los administradores tengan una más estricta, se usan los **PSO** (*Password Settings Objects*, o directivas de contraseña **específicas**, *fine-grained*), que se aplican a **usuarios o grupos**.

## Roles FSMO
Cinco tareas que solo puede hacer **un** DC a la vez: maestro de **esquema**, de **nombres de dominio**, **PDC**, **RID** e **infraestructura**. \`netdom query fsmo\` dice quién tiene cada uno.

## Las consolas que hay que reconocer
| Consola | Para… |
|---|---|
| \`dsa.msc\` | **Usuarios y equipos de Active Directory**: usuarios, grupos, OU |
| \`gpmc.msc\` | Administración de directivas de grupo |
| \`dnsmgmt.msc\` | DNS |
| \`dssite.msc\` | Sitios y servicios (replicación entre sedes) |
| \`lusrmgr.msc\` | Usuarios y grupos **locales** de un equipo (no del dominio) |`,
    quiz: [
      {
        q: 'Se quiere aplicar GPO al grupo de usuarios Profesores. ¿Qué conviene definir primero?',
        options: ['Una unidad organizativa (OU) para ellos', 'Un bosque nuevo', 'Una relación de confianza', 'Un rol FSMO'],
        answer: 0,
        why: 'Las GPO se vinculan a sitios, dominios y OU; agrupar a los Profesores en una OU es la buena práctica.',
      },
      {
        q: '¿Qué objeto permite aplicar una política de contraseñas distinta a un grupo dentro del mismo dominio?',
        options: ['Una GPO vinculada al grupo', 'Un PSO (Password Settings Object)', 'Un rol FSMO de PDC', 'Una OU nueva'],
        answer: 1,
        why: 'Las directivas de contraseña específicas (fine-grained) se crean como PSO y se aplican a usuarios o grupos.',
      },
      {
        q: 'Para añadir un usuario a un grupo global desde el DC, la herramienta gráfica nativa es…',
        options: ['lusrmgr.msc', 'netplwiz', 'dsa.msc (Usuarios y equipos de AD)', 'certmgr.msc'],
        answer: 2,
        why: 'lusrmgr.msc gestiona usuarios LOCALES; los de dominio se gestionan con dsa.msc.',
      },
      {
        q: '¿Qué protocolo usa Active Directory para autenticar a los usuarios?',
        options: ['RADIUS', 'Kerberos', 'TACACS+', 'SNMP'],
        answer: 1,
        why: 'Kerberos (con NTLM como reserva heredada).',
      },
    ],
    exam: ['tai2025A-P66', 'tai2025A-S2-18', 'tai2024A-S2-20', 'tai2025X-P27', 'tai2025X-S2-12', 'tai2022-S2R1', 'tai2019-S2-10'],
  },
  {
    id: 'win-dc',
    type: 'powershell',
    title: 'Instalar un controlador de dominio',
    summary: 'Install-WindowsFeature AD-Domain-Services -IncludeManagementTools y la promoción con Install-ADDSDomainController (examen 2025).',
    body: `**SRV-DC02** es un Windows Server 2019 unido al dominio **tai.local**. Hay que convertirlo en un **segundo controlador de dominio**. Son **dos pasos** distintos, y el examen pregunta por el primero.

## 1. Instalar el rol
\`\`\`
Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools
\`\`\`
- \`Get-WindowsFeature\` lista roles y características: \`[X]\` = instalado.
- \`-IncludeManagementTools\` añade las **herramientas de administración**: las consolas (\`dsa.msc\`…) y los cmdlets para promocionar el servidor. Sin ellas no podrías hacer el paso 2.
- No existen *Add-ADDSRole* ni *New-ADDomainService*: son las trampas del examen.

## 2. Promocionarlo
Instalar el rol no convierte el servidor en DC. Para eso:
- **Install-ADDSDomainController**: lo añade como DC **adicional** de un dominio que **ya existe** (este caso).
- **Install-ADDSForest**: crea un **bosque nuevo** con su primer dominio.
- (Install-ADDSDomain crea un dominio nuevo dentro de un bosque existente.)

\`\`\`
Install-ADDSDomainController -DomainName tai.local -InstallDns
\`\`\`
Pide la contraseña del **modo de restauración** (DSRM) y reinicia. Después, los servicios **NTDS** (el propio directorio) y **DNS** quedan en marcha: compruébalo con \`Get-Service\`.`,
    setup: {},
    objectives: [
      { label: 'Mira qué roles de Active Directory hay disponibles', check: psRan('Get-WindowsFeature') },
      { label: 'Instala el rol AD DS con sus herramientas de administración', check: (ps) => ps.state.features['AD-Domain-Services'].installed && ps.state.features['RSAT-ADDS'].installed },
      { label: 'Promociona SRV-DC02 a controlador de dominio adicional de tai.local, con DNS', check: (ps) => ps.state.ad.role === 'dc' && ps.state.ad.promotedWith === 'Install-ADDSDomainController' && ps.state.services.DNS?.status === 'Running' },
      {
        label: 'Comprueba que los servicios NTDS y DNS están en marcha',
        check: (ps) => ps.state.ad.role === 'dc' && Boolean(ps.log.at(-1)?.ok) && ps.log.at(-1).cmds.some((c) => c.name === 'Get-Service' && (!c.params.Name || c.params.Name.some((n) => /ntds/i.test(n)))),
      },
    ],
    hints: [
      'Get-WindowsFeature *AD*',
      'Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools',
      'Install-ADDSDomainController -DomainName tai.local -InstallDns',
      'Get-Service NTDS, DNS',
    ],
    curiosity: 'Hasta Windows Server 2012 la promoción se hacía con el asistente dcpromo.exe. Hoy dcpromo solo avisa de que ya no se usa: el Administrador del servidor y estos cmdlets de ADDSDeployment lo sustituyen.',
    exam: ['tai2025A-S2-19'],
  },
  {
    id: 'win-replicacion',
    type: 'powershell',
    title: 'Errores de replicación: repadmin y dcdiag',
    summary: 'repadmin /replsummary, dcdiag y repadmin /syncall para encontrar y arreglar un DC que no replica (examen 2025).',
    body: `Tras instalar **SRV-DC02**, los cambios que se hacen en SRV-DC01 no llegan. Hay **errores de replicación** entre los controladores de dominio.

## Las herramientas
- \`repadmin /replsummary\`: **resumen del estado de replicación** entre todos los DC, con cuántos intentos han fallado y el último error. Es lo primero que se mira (y la respuesta del examen).
- \`repadmin /showrepl\`: detalle de la replicación de **este** DC con cada vecino.
- \`dcdiag\`: **diagnóstico completo** del DC (conectividad, DNS, servicios, replicación…). \`dcdiag /q\` muestra **solo los errores**; \`dcdiag /test:dns\`, una prueba concreta.
- \`repadmin /syncall /AdeP\`: **fuerza** la replicación con todos los asociados (*A* todas las particiones, *d* nombres completos, *e* toda la empresa, *P* empujando los cambios).

Las otras opciones del examen hacen otras cosas: \`netdom query fsmo\` dice quién tiene los roles FSMO y \`nltest /sc_verify\` comprueba el canal seguro de un equipo con su dominio.

## Pista
AD depende del **DNS** para que los DC se encuentren entre sí. Un error **8524** («error de búsqueda DNS») apunta ahí.`,
    setup: { setup: SERVER_DC },
    objectives: [
      { label: 'Obtén el resumen del estado de replicación entre los DC', check: psRan('repadmin', (c) => args(c).startsWith('/replsummary')) },
      { label: 'Diagnostica el controlador de dominio con dcdiag', check: psRan('dcdiag') },
      { label: 'Arranca el servicio que está provocando el error', check: (ps) => ps.state.services.DNS.status === 'Running' },
      { label: 'Fuerza la replicación con todos los asociados', check: (ps) => ps.state.ad.replication.synced },
      { label: 'Comprueba que el resumen ya no tiene errores', check: (ps) => replicationOk(ps.state) && ps.state.ad.replication.checkedAfterFix === true },
    ],
    hints: [
      'repadmin /replsummary',
      'dcdiag /q (solo los errores) o dcdiag /test:dns',
      'Get-Service DNS · Start-Service DNS',
      'repadmin /syncall /AdeP',
      'repadmin /replsummary',
    ],
    curiosity: 'La replicación de AD es multimaestro: cualquier DC acepta cambios y los propaga a los demás. Dentro de un mismo sitio tarda segundos; entre sitios va por horarios que se configuran en Sitios y servicios (dssite.msc).',
    exam: ['tai2025A-S2R4'],
  },
  {
    id: 'win-sfc',
    type: 'powershell',
    title: 'Reparar Windows: sfc y DISM',
    summary: 'sfc /scannow, por qué a veces no puede reparar y DISM /RestoreHealth (examen 2024).',
    body: `SRV-DC02 da errores raros y pantallazos al arrancar algunos servicios. Sospechas que hay **ficheros del sistema dañados**.

## sfc: el comprobador de recursos
\`\`\`
sfc /scannow
\`\`\`
**Examina todos los ficheros protegidos del sistema** y **reemplaza los dañados por una copia en caché** (el *almacén de componentes*, en \`C:\\Windows\\WinSxS\`). Necesita una consola de **administrador**. \`sfc /verifyonly\` solo comprueba, sin reparar.

## ¿Y si la copia en caché también está mal?
Entonces sfc dice que encontró archivos dañados «pero **no pudo corregir** algunos». Primero hay que reparar el almacén con **DISM** (*Deployment Image Servicing and Management*), que descarga las piezas buenas de Windows Update:
\`\`\`
DISM /Online /Cleanup-Image /CheckHealth      # ¿está marcado como dañado?
DISM /Online /Cleanup-Image /RestoreHealth    # repáralo
\`\`\`
y después **otra vez** \`sfc /scannow\`.

## No confundir
| Herramienta | Repara… |
|---|---|
| \`sfc /scannow\` | ficheros del **sistema** |
| \`DISM /RestoreHealth\` | el **almacén de componentes** (la imagen de Windows) |
| \`chkdsk /f\` | el **sistema de ficheros** del disco (NTFS); el \`fsck\` de Windows |
| \`bootrec\`, \`bcdboot\` | el **arranque** (desde el entorno de recuperación) |`,
    setup: {
      setup: (st) => {
        st.sfc.corrupt = ['C:\\Windows\\System32\\drivers\\netio.sys', 'C:\\Windows\\System32\\ntdsai.dll'];
        st.sfc.storeCorrupt = true;
      },
    },
    objectives: [
      { label: 'Examina y repara los ficheros protegidos del sistema', check: psRan('sfc', (c) => args(c) === '/scannow') },
      { label: 'Repara el almacén de componentes que usa sfc', check: (ps) => !ps.state.sfc.storeCorrupt },
      { label: 'Vuelve a pasar sfc hasta que repare todos los ficheros', check: (ps) => ps.state.sfc.repaired },
    ],
    hints: ['sfc /scannow', 'DISM /Online /Cleanup-Image /RestoreHealth', 'sfc /scannow'],
    curiosity: 'sfc deja un registro detallado de cada fichero que revisa en C:\\Windows\\Logs\\CBS\\CBS.log. Es enorme: lo habitual es filtrar las líneas con «[SR]» para ver solo las de sfc.',
    exam: ['tai2024A-P56'],
  },
];
