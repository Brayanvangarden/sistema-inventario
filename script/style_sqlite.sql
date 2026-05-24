PRAGMA foreign_keys = ON;

-- ========================
-- TABLA PERSONA
-- ========================
CREATE TABLE persona (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    telefono TEXT,
    correo TEXT UNIQUE,
    direccion TEXT,
    cedula TEXT,
    activo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_persona_nombre ON persona(nombre);
CREATE INDEX IF NOT EXISTS idx_persona_correo ON persona(correo);
CREATE INDEX IF NOT EXISTS idx_persona_cedula ON persona(cedula);

-- ========================
--  TABLA CLIENTES
-- ========================
CREATE TABLE clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_persona INTEGER NOT NULL,
    activo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    update_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(id_persona) REFERENCES persona(id)
);

-- ===========
-- PROVEEDORES
-- ===========
CREATE TABLE proveedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_persona INTEGER,
    empresa TEXT,
    activo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    update_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(id_persona) REFERENCES persona(id)
);

-- ===========
-- ROLES
-- ===========
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL CHECK(nombre IN ('ADMIN','VENDEDOR')),
    activo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ===========
-- USUARIOS
-- ===========
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_persona INTEGER NOT NULL,
    usuario TEXT NOT NULL UNIQUE,
    contrasena TEXT NOT NULL,
    id_rol INTEGER NOT NULL,
    activo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_persona) REFERENCES persona(id),
    FOREIGN KEY (id_rol) REFERENCES roles(id)
);

-- =========================================
-- TIENDA
-- =========================================
CREATE TABLE tienda (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    direccion TEXT,
    telefono TEXT,
    activo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- HORARIOS
-- =========================================
CREATE TABLE horarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_tienda INTEGER NOT NULL,
    dia TEXT,
    hora_apertura TEXT,
    hora_cierre TEXT,
    FOREIGN KEY (id_tienda) REFERENCES tienda(id)
);

-- =========================================
-- CATEGORIAS
-- =========================================
CREATE TABLE categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    activo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- PRODUCTOS
-- =========================================
CREATE TABLE productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    id_categoria INTEGER NOT NULL,
    precio_compra REAL NOT NULL,
    precio_venta REAL NOT NULL,
    activo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id)
);

-- =========================================
-- INVENTARIO
-- =========================================
CREATE TABLE inventario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_producto INTEGER NOT NULL,
    stock INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    activo INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_producto),
    FOREIGN KEY (id_producto) REFERENCES productos(id)
);

-- =========================================
-- MOVIMIENTOS (KARDEX)
-- =========================================
CREATE TABLE movimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_producto INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('ENTRADA','SALIDA')),
    cantidad INTEGER NOT NULL,
    descripcion TEXT,
    fecha TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_producto) REFERENCES productos(id)
);

-- =========================================
-- FACTURA (ENCABEZADO)
-- =========================================
CREATE TABLE factura (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente INTEGER,
    id_usuario INTEGER NOT NULL,
    total REAL DEFAULT 0,
    estado TEXT DEFAULT 'PENDIENTE' CHECK(estado IN ('PENDIENTE','PAGADA','ANULADA')),
    fecha TEXT DEFAULT CURRENT_TIMESTAMP,
    id_metodo_pago INTEGER,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
);

-- =========================================
-- DETALLE FACTURA
-- =========================================
CREATE TABLE factura_detalle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_factura INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (id_factura) REFERENCES factura(id),
    FOREIGN KEY (id_producto) REFERENCES productos(id)
);

-- ========================
-- DATOS DE EJEMPLO
-- ========================
INSERT INTO roles (nombre) VALUES ('ADMIN'), ('VENDEDOR');

INSERT INTO persona (nombre, apellido, telefono, correo, direccion, cedula) VALUES
('Ana','Lopez','88881111','ana@gmail.com','San José','1111111111'),
('Carlos','Perez','88882222','carlos@gmail.com','Alajuela','2222222222'),
('Maria','Gomez','88883333','maria@gmail.com','Cartago','3333333333'),
('Luis','Rodriguez','88884444','luis@gmail.com','Heredia','4444444444'),
('Sofia','Ramirez','88885555','sofia@gmail.com','San José','5555555555'),
('Pedro','Sanchez','88886666','pedro@gmail.com','Puntarenas','6666666666'),
('Laura','Fernandez','88887777','laura@gmail.com','Limón','7777777777'),
('Jorge','Castro','88888888','jorge@gmail.com','San José','8888888888'),
('Elena','Mora','88889999','elena@gmail.com','Cartago','9999999999'),
('David','Vargas','88880000','david@gmail.com','Heredia','1010101010');

INSERT INTO clientes (id_persona) VALUES
(1),(2),(3),(4),(5);

INSERT INTO proveedores (id_persona, empresa) VALUES
(6,'Belleza CR'),
(7,'Cosmeticos Premium'),
(8,'Distribuidora Glam'),
(9,'Makeup Supply'),
(10,'Estetica Total');

INSERT INTO tienda (nombre, direccion, telefono) VALUES
('Beauty Store','San José Centro','22223333');

INSERT INTO horarios (id_tienda, dia, hora_apertura, hora_cierre) VALUES
(1,'LUNES','09:00','18:00'),
(1,'MARTES','09:00','18:00'),
(1,'MIERCOLES','09:00','18:00'),
(1,'JUEVES','09:00','18:00'),
(1,'VIERNES','09:00','18:00'),
(1,'SABADO','09:00','13:00');

INSERT INTO categorias (nombre) VALUES
('Labiales'),
('Esmaltes'),
('Pinceles'),
('Maquillaje'),
('Accesorios');

INSERT INTO productos (codigo, nombre, id_categoria, precio_compra, precio_venta) VALUES
('LAB001','Labial Rojo Mate',1,2000,3500),
('LAB002','Labial Nude',1,1800,3200),
('ESM001','Esmalte Rojo',2,1000,2000);


-- Insertar persona
INSERT INTO persona (
    nombre,
    apellido,
    telefono,
    correo,
    direccion,
    cedula
) VALUES (
    'Jeilen',
    'Miranda Valverde',
    '87894561',
    'jeilen.miranda@gmail.com',
    'San José, Costa Rica',
    '1234567890'
);

-- Crear usuario ADMIN usando el id de la persona creada
INSERT INTO usuarios (
    id_persona,
    usuario,
    contrasena,
    id_rol
) VALUES (
    last_insert_rowid(),   -- toma el último ID insertado en persona
    'jeilen_admin',
    '1234',
    1                      -- 1 = ADMIN
);