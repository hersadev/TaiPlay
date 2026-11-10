// Ejercicios de almacenamiento: unidades decimales (KB, MB…) frente a
// binarias (KiB, MiB…), velocidades de red frente a tamaños de fichero, y
// capacidad y tolerancia a fallos de los niveles RAID.
//
// Todas las respuestas son números enteros: se eligen los datos para que
// las cuentas salgan exactas.

import { int, pick } from './random.js';

const SI = ['bytes', 'KB', 'MB', 'GB', 'TB'];
const IEC = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
const miles = (n) => n.toLocaleString('es-ES');

export const STORAGE_KINDS = {
  unidades: {
    label: 'KB y KiB',
    make(rng) {
      const binary = rng() < 0.5;
      const units = binary ? IEC : SI;
      const factor = binary ? 1024 : 1000;
      const from = int(rng, 2, 4);
      const steps = rng() < 0.75 ? 1 : 2;
      const to = from - steps;
      const big = int(rng, 2, 12);
      const ratio = factor ** steps;
      const up = rng() < 0.5;
      const [qty, qUnit, ans, aUnit] = up ? [big * ratio, units[to], big, units[from]] : [big, units[from], big * ratio, units[to]];
      const sense = up ? `se divide entre ${miles(ratio)}` : `se multiplica por ${miles(ratio)}`;
      return {
        prompt: `¿Cuántos **${aUnit}** son **${miles(qty)} ${qUnit}**?`,
        fields: [{ key: 'n', label: aUnit, type: 'int', answer: ans, placeholder: '0' }],
        explain: `${binary ? 'Las unidades con **i** (KiB, MiB, GiB…) son **binarias**: cada una son **1024** de la anterior' : 'Las unidades sin **i** (KB, MB, GB…) son las del Sistema Internacional: cada una son **1000** de la anterior'}. De ${up ? aUnit : qUnit} a ${up ? qUnit : aUnit} hay ${steps} ${steps === 1 ? 'salto' : 'saltos'}, así que ${sense}: **${miles(ans)} ${aUnit}**. ${binary ? 'Por eso un disco de 1 TB (10¹² bytes) aparece en el sistema como unos 931 GiB: no falta nada, es otra unidad.' : 'Los fabricantes de discos usan estas: 1 TB son 10¹² bytes, que el sistema muestra como unos 931 GiB.'}`,
      };
    },
  },

  velocidad: {
    label: 'Mbps y MB/s',
    make(rng) {
      const kind = pick(rng, ['a-bytes', 'a-bits', 'tiempo']);
      if (kind === 'a-bytes') {
        const mbps = pick(rng, [8, 16, 40, 80, 160, 200, 400, 800, 1000, 2400, 10000]);
        return {
          prompt: `Una conexión de **${miles(mbps)} Mbps**, ¿cuántos **MB/s** transfiere como máximo?`,
          fields: [{ key: 'n', label: 'MB/s', type: 'int', answer: mbps / 8, placeholder: '0' }],
          explain: `La velocidad de red va en **bits** por segundo (b minúscula) y los ficheros en **bytes** (B mayúscula). 1 byte = 8 bits, así que se divide entre 8: ${miles(mbps)} ÷ 8 = **${miles(mbps / 8)} MB/s**.`,
        };
      }
      if (kind === 'a-bits') {
        const mbs = pick(rng, [5, 10, 25, 50, 100, 125, 250, 1250]);
        return {
          prompt: `Una copia avanza a **${miles(mbs)} MB/s**. ¿Cuántos **Mbps** de la red está ocupando?`,
          fields: [{ key: 'n', label: 'Mbps', type: 'int', answer: mbs * 8, placeholder: '0' }],
          explain: `De bytes a bits se multiplica por 8: ${miles(mbs)} × 8 = **${miles(mbs * 8)} Mbps**.`,
        };
      }
      const mbps = pick(rng, [8, 16, 40, 80, 160, 200, 400, 800, 1000]);
      const secs = int(rng, 2, 60);
      const mb = (mbps / 8) * secs;
      return {
        prompt: `¿Cuántos **segundos** tarda en transferirse un fichero de **${miles(mb)} MB** por una línea de **${miles(mbps)} Mbps** (sin contar sobrecargas)?`,
        fields: [{ key: 'n', label: 'Segundos', type: 'int', answer: secs, placeholder: '0' }],
        explain: `Primero, todo en la misma unidad. La línea da ${miles(mbps)} ÷ 8 = ${miles(mbps / 8)} MB/s. Después, tamaño ÷ velocidad: ${miles(mb)} ÷ ${miles(mbps / 8)} = **${secs} s**. (También vale pasar el fichero a bits: ${miles(mb)} × 8 = ${miles(mb * 8)} Mb, entre ${miles(mbps)} Mbps.)`,
      };
    },
  },

  raid: {
    label: 'RAID',
    make(rng) {
      const level = pick(rng, ['0', '1', '5', '6', '10']);
      const size = pick(rng, [1, 2, 4, 6, 8, 10, 12, 16]);
      const n = { 0: int(rng, 2, 6), 1: rng() < 0.8 ? 2 : 3, 5: int(rng, 3, 8), 6: int(rng, 4, 8), 10: pick(rng, [4, 6, 8]) }[level];
      const info = {
        0: { cap: n * size, fail: 0, how: `RAID 0 (*striping*) reparte los datos entre todos los discos sin ninguna copia: suma toda la capacidad (${n} × ${size}) y **no tolera ningún fallo**. Si cae un disco se pierde todo.` },
        1: { cap: size, fail: n - 1, how: `RAID 1 (*espejo*) escribe lo mismo en todos los discos: la capacidad es la de **uno solo** (${size} TB) y aguanta mientras quede uno vivo, es decir, **${n - 1}** ${n - 1 === 1 ? 'fallo' : 'fallos'}.` },
        5: { cap: (n - 1) * size, fail: 1, how: `RAID 5 reparte la **paridad** entre todos los discos y gasta el equivalente a **uno**: (${n} − 1) × ${size}. Tolera **1** fallo. Necesita al menos 3 discos.` },
        6: { cap: (n - 2) * size, fail: 2, how: `RAID 6 guarda **doble paridad** y gasta el equivalente a **dos** discos: (${n} − 2) × ${size}. Tolera **2** fallos a la vez. Necesita al menos 4 discos.` },
        10: { cap: (n / 2) * size, fail: 1, how: `RAID 10 hace espejos de dos discos y reparte los datos entre ellos (*stripe* de *mirrors*): la mitad de la capacidad, ${n} × ${size} ÷ 2. Puede sobrevivir a varios fallos si caen en espejos distintos, pero **en el peor caso** (los dos discos del mismo espejo) basta con **2** para perder datos, así que lo garantizado es **1**. Necesita al menos 4 discos.` },
      }[level];
      return {
        prompt: `Un **RAID ${level}** con **${n} discos de ${size} TB**: ¿qué capacidad útil tiene y cuántos discos pueden fallar a la vez, **como mínimo garantizado**, sin perder datos?`,
        fields: [
          { key: 'cap', label: 'Capacidad útil (TB)', type: 'int', answer: info.cap, placeholder: '0' },
          { key: 'fail', label: 'Fallos tolerados', type: 'int', answer: info.fail, placeholder: '0' },
        ],
        explain: `${info.how} Capacidad útil: **${info.cap} TB**.`,
      };
    },
  },
};
