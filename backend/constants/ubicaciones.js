// Listas de referencia para nacionalidad y departamento de las clientas

export const DEPARTAMENTOS = [
  'La Paz',
  'Cochabamba',
  'Sucre (Chuquisaca)',
  'Santa Cruz de la Sierra',
  'Tarija',
  'Beni',
  'Pando',
  'Potosí',
  'Oruro'
];

export const NACIONALIDADES = [
  'Boliviana',
  'Peruana',
  'Chilena',
  'Argentina',
  'Brasileña',
  'Paraguaya',
  'Uruguaya',
  'Ecuatoriana',
  'Colombiana',
  'Otra'
];

// Normaliza texto para comparar sin tildes ni mayúsculas
const strip = s => String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Alias comunes que pueden venir en un Excel importado
const ALIAS_DEPARTAMENTO = {
  'chuquisaca': 'Sucre (Chuquisaca)',
  'sucre': 'Sucre (Chuquisaca)',
  'santa cruz': 'Santa Cruz de la Sierra',
  'santa cruz de la sierra': 'Santa Cruz de la Sierra',
  'scz': 'Santa Cruz de la Sierra',
  'lapaz': 'La Paz',
  'lp': 'La Paz',
  'cocha': 'Cochabamba',
  'potosi': 'Potosí'
};

const ALIAS_NACIONALIDAD = {
  'boliviana': 'Boliviana',
  'bolivia': 'Boliviana',
  'bo': 'Boliviana',
  'peruana': 'Peruana',
  'peru': 'Peruana',
  'chilena': 'Chilena',
  'chile': 'Chilena',
  'argentina': 'Argentina',
  'brasileña': 'Brasileña',
  'brasilenia': 'Brasileña',
  'brasil': 'Brasileña',
  'paraguaya': 'Paraguaya',
  'paraguay': 'Paraguaya',
  'uruguaya': 'Uruguaya',
  'uruguay': 'Uruguaya',
  'ecuatoriana': 'Ecuatoriana',
  'ecuador': 'Ecuatoriana',
  'colombiana': 'Colombiana',
  'colombia': 'Colombiana'
};

// Devuelve el valor canónico de la lista, o null si está vacío.
// Si no coincide con ningún ítem, devuelve el texto tal cual (recortado).
export function normalizarDepartamento(valor) {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  if (!texto) return null;
  const key = strip(texto);
  if (ALIAS_DEPARTAMENTO[key]) return ALIAS_DEPARTAMENTO[key];
  const encontrado = DEPARTAMENTOS.find(d => strip(d) === key);
  return (encontrado || texto).slice(0, 50);
}

export function normalizarNacionalidad(valor) {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  if (!texto) return null;
  const key = strip(texto);
  if (ALIAS_NACIONALIDAD[key]) return ALIAS_NACIONALIDAD[key];
  const encontrado = NACIONALIDADES.find(n => strip(n) === key);
  return (encontrado || texto).slice(0, 30);
}
