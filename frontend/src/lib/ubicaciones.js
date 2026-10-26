// Listas de referencia para nacionalidad y departamento de las clientas
// (deben coincidir con backend/constants/ubicaciones.js)

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

// Valor del select para indicar "escribir una localidad que no está en la lista"
export const OTRA_PROVINCIA = '__otra__';

// Lista de provincias de un departamento ('' si no se conoce)
export function provinciasDe(departamento) {
  if (!departamento) return [];
  return PROVINCIAS[departamento] || [];
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
