const ESTADOS = {
    PENDIENTE:   'pendiente',
    PAGADO:      'pagado',
    VENCIDO:     'vencido',
    FINALIZADO:  'finalizado',
    EN_CUSTODIA: 'en_custodia',
    RETIRADO:    'retirado'
};

const FRECUENCIAS = {
    DIARIO:    'diario',
    SEMANAL:   'semanal',
    QUINCENAL: 'quincenal',
    MENSUAL:   'mensual'
};

const FRECUENCIAS_VALIDAS = Object.values(FRECUENCIAS);

const ROLES = {
    ADMIN:    'admin',
    EMPLEADO: 'empleado'
};

const ROLES_VALIDOS = Object.values(ROLES);

module.exports = { ESTADOS, FRECUENCIAS, FRECUENCIAS_VALIDAS, ROLES, ROLES_VALIDOS };
