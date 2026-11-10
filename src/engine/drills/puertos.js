// Ejercicios de puertos bien conocidos: de puerto a servicio (elegir entre
// cuatro) y de servicio a puerto (escribirlo).

import { pick } from './random.js';

// name: como se elige en las opciones; ask: cómo se pregunta el puerto;
// note: el detalle que suele caer en el examen.
export const PUERTOS = [
  { port: 20, name: 'FTP (datos)', ask: 'FTP, canal de **datos** en modo activo', proto: 'TCP', note: 'FTP usa dos conexiones: 21 para las órdenes y 20 para los datos (en modo activo).' },
  { port: 21, name: 'FTP (control)', ask: 'FTP, canal de **control** (órdenes)', proto: 'TCP', note: 'FTP usa dos conexiones: 21 para las órdenes y 20 para los datos (en modo activo). Va sin cifrar.' },
  { port: 22, name: 'SSH', ask: 'SSH (y también SFTP y SCP)', proto: 'TCP', note: 'SFTP y SCP van por dentro de SSH, así que usan el mismo puerto.' },
  { port: 23, name: 'Telnet', ask: 'Telnet', proto: 'TCP', note: 'Telnet va en claro: se sustituye por SSH (22).' },
  { port: 25, name: 'SMTP', ask: 'SMTP entre servidores de correo', proto: 'TCP', note: 'Para que los clientes envíen correo se usa 587 (submission, con STARTTLS) o 465 (SMTPS).' },
  { port: 53, name: 'DNS', ask: 'DNS', proto: 'UDP y TCP', note: 'Las consultas normales van por UDP; las transferencias de zona y las respuestas grandes, por TCP.' },
  { port: 67, name: 'DHCP (servidor)', ask: 'DHCP, en el **servidor**', proto: 'UDP', note: 'El servidor DHCP escucha en el 67 y el cliente en el 68.' },
  { port: 69, name: 'TFTP', ask: 'TFTP', proto: 'UDP', note: 'TFTP (FTP trivial) no tiene autenticación: se usa para arrancar por red (PXE) o subir firmware a equipos de red.' },
  { port: 80, name: 'HTTP', ask: 'HTTP', proto: 'TCP', note: 'Lo habitual es dejarlo abierto solo para redirigir a HTTPS (443).' },
  { port: 88, name: 'Kerberos', ask: 'Kerberos', proto: 'TCP y UDP', note: 'Es la autenticación de Active Directory.' },
  { port: 110, name: 'POP3', ask: 'POP3', proto: 'TCP', note: 'POP3 descarga el correo al equipo; su versión cifrada, POP3S, usa el 995.' },
  { port: 123, name: 'NTP', ask: 'NTP (sincronizar la hora)', proto: 'UDP', note: 'La hora sincronizada es imprescindible para Kerberos y para cuadrar los logs.' },
  { port: 143, name: 'IMAP', ask: 'IMAP', proto: 'TCP', note: 'IMAP deja el correo en el servidor y lo sincroniza; su versión cifrada, IMAPS, usa el 993.' },
  { port: 161, name: 'SNMP', ask: 'SNMP (consultas al agente)', proto: 'UDP', note: 'Las consultas van al 161 y las alertas (traps) llegan al 162.' },
  { port: 389, name: 'LDAP', ask: 'LDAP', proto: 'TCP', note: 'LDAP sobre TLS (LDAPS) usa el 636.' },
  { port: 443, name: 'HTTPS', ask: 'HTTPS', proto: 'TCP', note: 'HTTP/3 también usa el 443, pero sobre UDP (QUIC).' },
  { port: 445, name: 'SMB', ask: 'SMB (carpetas compartidas de Windows)', proto: 'TCP', note: 'Nunca debe quedar expuesto a Internet: por él se propagó WannaCry.' },
  { port: 514, name: 'Syslog', ask: 'Syslog (envío de logs)', proto: 'UDP', note: 'Syslog clásico va por UDP 514; con TLS se usa el 6514/TCP.' },
  { port: 587, name: 'SMTP (envío de clientes)', ask: 'SMTP para que los **clientes envíen** correo (submission)', proto: 'TCP', note: 'El 587 exige autenticación y STARTTLS; el 25 queda para hablar entre servidores.' },
  { port: 636, name: 'LDAPS', ask: 'LDAP cifrado (LDAPS)', proto: 'TCP', note: 'Es LDAP (389) sobre TLS.' },
  { port: 993, name: 'IMAPS', ask: 'IMAP cifrado (IMAPS)', proto: 'TCP', note: 'Es IMAP (143) sobre TLS.' },
  { port: 995, name: 'POP3S', ask: 'POP3 cifrado (POP3S)', proto: 'TCP', note: 'Es POP3 (110) sobre TLS.' },
  { port: 1433, name: 'SQL Server', ask: 'Microsoft SQL Server (motor de base de datos)', proto: 'TCP', note: 'El servicio SQL Server Browser usa además el 1434/UDP.' },
  { port: 1521, name: 'Oracle', ask: 'Oracle Database (listener)', proto: 'TCP', note: 'Es el puerto por defecto del listener de Oracle.' },
  { port: 3306, name: 'MySQL / MariaDB', ask: 'MySQL o MariaDB', proto: 'TCP', note: 'Solo debería abrirse a los servidores de aplicación, nunca a toda la red.' },
  { port: 3389, name: 'RDP', ask: 'Escritorio remoto de Windows (RDP)', proto: 'TCP', note: 'Es de los puertos más atacados: mejor detrás de una VPN.' },
  { port: 5432, name: 'PostgreSQL', ask: 'PostgreSQL', proto: 'TCP', note: 'Se configura en postgresql.conf (port) y los accesos en pg_hba.conf.' },
  { port: 8080, name: 'HTTP alternativo', ask: 'HTTP alternativo (proxies, Tomcat, pruebas)', proto: 'TCP', note: 'No es oficial para nada concreto, pero es la convención para un segundo servidor web.' },
];

const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const PORT_KINDS = {
  'puerto-servicio': {
    label: 'puerto → servicio',
    make(rng) {
      const p = pick(rng, PUERTOS);
      const others = shuffle(
        PUERTOS.filter((x) => x.port !== p.port && x.name.split(' ')[0] !== p.name.split(' ')[0]),
        rng,
      ).slice(0, 3);
      const choices = shuffle([p, ...others], rng).map((x) => x.name);
      return {
        prompt: `¿Qué servicio usa por defecto el puerto **${p.port}/${p.proto.split(' ')[0]}**?`,
        choices,
        fields: [{ key: 'svc', label: 'Servicio', type: 'choice', answer: p.name }],
        explain: `El **${p.port}** es **${p.name}** (${p.proto}). ${p.note}`,
      };
    },
  },

  'servicio-puerto': {
    label: 'servicio → puerto',
    make(rng) {
      const p = pick(rng, PUERTOS);
      return {
        prompt: `¿Qué puerto usa por defecto **${p.ask}**?`,
        fields: [{ key: 'port', label: 'Puerto', type: 'int', answer: p.port, placeholder: '0' }],
        explain: `**${p.port}/${p.proto}**. ${p.note}`,
      };
    },
  },
};
