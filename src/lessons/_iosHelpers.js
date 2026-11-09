// Validadores de las lecciones de Cisco IOS y de los ejercicios generados.
// Los de IOS reciben el switch (engine/ios/ios.js) y miran su estado; los
// de ejercicios reciben el recuento de aciertos por tipo.

import { parseIface } from '../engine/ios/ios.js';

const iface = (sw, name) => sw.ifaces[parseIface(name)[0]];

// Alguna orden aceptada encaja (se compara la orden ya expandida: «conf t»
// queda como «configure terminal»).
export const iosRan = (re) => (sw) => sw.log.some((e) => e.ok && e.canon && re.test(e.canon));

export const vlanNamed = (id, name) => (sw) => sw.vlans[id]?.name.toUpperCase() === name.toUpperCase();

export const accessPort = (name, vlan) => (sw) => {
  const i = iface(sw, name);
  return i.mode === 'access' && i.accessVlan === vlan;
};

export const trunkPort = (name, vlans) => (sw) => {
  const i = iface(sw, name);
  if (i.mode !== 'trunk') return false;
  if (!vlans) return true;
  return i.allowed !== 'all' && i.allowed.length === vlans.length && vlans.every((v) => i.allowed.includes(v));
};

export const sviIs = (vlan, { ip, mask, helper, up } = {}) => (sw) => {
  const s = sw.ifaces[`Vlan${vlan}`];
  if (!s) return false;
  return (
    (!ip || s.ip === ip) &&
    (!mask || s.mask === mask) &&
    (!helper || s.helpers.includes(helper)) &&
    (up === undefined || s.shutdown === !up)
  );
};

export const stickyOn = (name) => (sw) => {
  const i = iface(sw, name);
  return i.ps.enabled && i.ps.sticky && i.ps.macs.length > 0;
};

export const routingOn = (sw) => sw.ipRouting;

// Guardada después de haber cambiado algo: la de arranque coincide con la
// de ejecución y se ha usado copy run start o write.
export const savedConfig = (sw) => sw.saved() && iosRan(/^(do )?(copy running-config startup-config|write)/)(sw);

// Ejercicios: (aciertos por tipo) => boolean
export const solved = (kind, need) => (counts) => (counts?.[kind] ?? 0) >= need;
export const drillGoal = (drill, need, label) => ({ label, drill, need, check: solved(drill, need) });
