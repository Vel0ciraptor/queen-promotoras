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

// Provincia / localidad (municipio) principal de cada departamento.
// Lista curada: se puede escribir otra a mano ("Otra localidad").
export const PROVINCIAS = {
  'Santa Cruz de la Sierra': [
    'Santa Cruz (capital)',
    'Yacuiba',
    'Camiri',
    'Montero',
    'Warnes',
    'Cotoca',
    'Buena Vista',
    'San Ignacio de Velasco',
    'Roboré',
    'Vallegrande',
    'Cuatro Cañadas',
    'Portachuelo',
    'El Torno',
    'Pailón',
    'San José de Chiquitos',
    'Ascensión de Guarayos',
    'El Carmen Rivero Tórrez',
    'Magdalena',
    'Urubichá',
    'Basirú'
  ],
  'Cochabamba': [
    'Cochabamba (capital)',
    'Villa Tunari',
    'Sacaba',
    'Quillacollo',
    'Tiquipaya',
    'Punata',
    'Tarata',
    'Aiquile',
    'Colcapirhua',
    'Sipe Sipe',
    'Tapacarí',
    'Pocona',
    'Omereque',
    'Shinahota',
    'Ivirgarzama',
    'Villa 14 de Septiembre',
    'Tres Ríos',
    'Bulo Bulo'
  ],
  'Tarija': [
    'Tarija (capital)',
    'Villamontes',
    'Bermejo',
    'San Lorenzo',
    'Urubichá',
    'Entre Ríos',
    'Tomatitas',
    'El Puente',
    'San Pedro de Concepción',
    'Ciénegas',
    'Palos Blancos'
  ],
  'La Paz': [
    'La Paz (capital)',
    'Viacha',
    'Achacachi',
    'Copacabana',
    'Desaguadero',
    'Chulumani',
    'Coroico',
    'Pucarani',
    'Laja',
    'Batallas',
    'Ancoraimes',
    'Tipuani',
    'Ixiamas',
    'San Buenaventura',
    'Mapiri',
    'Zongo'
  ],
  'Beni': [
    'Trinidad (capital)',
    'Riberalta',
    'Guayaramerín',
    'Rurrenabaque',
    'San Borja',
    'San Ignacio de Moxos',
    'Magdalena',
    'Baures',
    'Huacaraje',
    'Reyes',
    'San Javier',
    'Santa Ana del Yacuma'
  ],
  'Potosí': [
    'Potosí (capital)',
    'Uyuni',
    'Llallagua',
    'Villazón',
    'Tupiza',
    'Colcha "K"',
    'Uncías',
    'Chaquilla',
    'Betanzos',
    'Tinguipaya',
    'San Pedro de Quemes',
    'Cotagaita',
    'Vitichi',
    'Incahuasi'
  ],
  'Oruro': [
    'Oruro (capital)',
    'Huanuni',
    'Caracollo',
    'Challapata',
    'Huayllas',
    'Santuario de Quillacas',
    'Poopó',
    'Pazña',
    'Huari',
    'La Joya',
    'Totora'
  ],
  'Sucre (Chuquisaca)': [
    'Sucre (capital)',
    'Tarabuco',
    'Yamparáez',
    'Monteagudo',
    'Camargo',
    'Icla',
    'El Vilár',
    'Presto',
    'Mojocoya',
    'Zudáñez',
    'San Lucas',
    'Incahuasi'
  ],
  'Pando': [
    'Cobija (capital)',
    'Porvenir',
    'Filadelfia',
    'Puerto Rico',
    'San Lorenzo',
    'Santa Rosa',
    'Nueva Esperanza',
    'Bolpebra',
    'Fortaleza'
  ]
};

// Lista de provincias de un departamento ('' si no se conoce)
export function provinciasDe(departamento) {
  if (!departamento) return [];
  return PROVINCIAS[departamento] || [];
}

// ¿El texto corresponde a un departamento de la lista (o su alias)?
export function esDepartamento(valor) {
  if (valor === undefined || valor === null) return false;
  const key = strip(String(valor).trim());
  if (!key) return false;
  if (ALIAS_DEPARTAMENTO[key]) return true;
  return DEPARTAMENTOS.some(d => strip(d) === key);
}

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

// Alias comunes de provincias/localidades que pueden venir escritos distinto
const ALIAS_PROVINCIA = {
  'v tunari': 'Villa Tunari',
  'v. tunari': 'Villa Tunari',
  'villamontes': 'Villamontes',
  'villa montes': 'Villamontes',
  'san ignacio': 'San Ignacio de Velasco',
  's. ignacio': 'San Ignacio de Velasco',
  'stgo de chiquitos': 'San José de Chiquitos',
  'el carmen': 'El Carmen Rivero Tórrez',
  'capital': null // sin sentido sin departamento: se ignora
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

// Devuelve el valor canónico de la provincia/localidad, o null si está vacío.
// Busca primero en la lista del departamento indicado; si no, en la lista
// global de provincias. Si no coincide con ningún ítem (localidad escrita
// a mano), devuelve el texto tal cual (recortado a 80).
export function normalizarProvincia(valor, departamento) {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  if (!texto) return null;
  const key = strip(texto);
  if (key in ALIAS_PROVINCIA) return ALIAS_PROVINCIA[key];
  const lista = provinciasDe(departamento);
  const enDepartamento = lista.find(p => strip(p) === key);
  if (enDepartamento) return enDepartamento;
  for (const dept of Object.keys(PROVINCIAS)) {
    const enOtro = PROVINCIAS[dept].find(p => strip(p) === key);
    if (enOtro) return enOtro;
  }
  return texto.slice(0, 80);
}
