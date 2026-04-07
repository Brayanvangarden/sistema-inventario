-- ===== Creación de la base de datos 
create database style;
use style;

-- ========================
-- TABLA PERSONA
-- ========================
CREATE TABLE persona (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(100) UNIQUE,
    direccion TEXT,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre),
    INDEX idx_correo (correo)
) ENGINE=InnoDB;
-- ========================
--  TABLA CLIENTES
-- ========================
create table clientes (
id int unsigned auto_increment primary key,
id_persona int unsigned not null,
activo tinyint(1) default 1,
created_at timestamp default current_timestamp,
update_at timestamp default current_timestamp on update current_timestamp,
INDEX idx_persona (id_persona),
foreign key(id_persona) references persona(id)
)ENGINE= InnoDB;

-- ===========
-- PROVEEDORES
-- ===========
CREATE TABLE proveedores(
id int unsigned auto_increment primary key,
id_persona int unsigned null,
empresa varchar(100),
activo tinyint(1) default 1,
created_at timestamp default current_timestamp,
update_at timestamp default current_timestamp on update current_timestamp,
index idx_persona(id_persona),
foreign key(id_persona) references persona(id)
)engine = InnoDB ;

-- ===========
-- Roles
-- ===========

create table roles(
 id int unsigned auto_increment primary key,
 nombre enum('ADMIN','VENDEDOR') not null,
 activo tinyint(1) default 1,
 created_at timestamp default current_timestamp
)engine=InnoDB;

-- ===========
-- INSERT ROLES
-- ===========
insert into roles (nombre) values ('ADMIN'),('VENDEDOR');

-- ===========
--  USUARIOS
-- ===========
CREATE TABLE usuarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_persona INT UNSIGNED NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    id_rol INT UNSIGNED NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario),
    INDEX idx_rol (id_rol),
    FOREIGN KEY (id_persona) REFERENCES persona(id),
    FOREIGN KEY (id_rol) REFERENCES roles(id)
) ENGINE=InnoDB;

-- =========================================
-- TIENDA
-- =========================================
CREATE TABLE tienda (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) unique NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================================
-- HORARIOS
-- =========================================
CREATE TABLE horarios (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_tienda INT UNSIGNED NOT NULL,
    dia ENUM('LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'),
    hora_apertura TIME,
    hora_cierre TIME,
    INDEX idx_tienda (id_tienda),
    FOREIGN KEY (id_tienda) REFERENCES tienda(id)
) ENGINE=InnoDB;

-- =========================================
-- CATEGORIAS
-- =========================================
CREATE TABLE categorias (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) unique NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre)
) ENGINE=InnoDB;

-- =========================================
-- PRODUCTOS
-- =========================================
CREATE TABLE productos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(50) UNIQUE  not null,
    id_categoria INT UNSIGNED NOT NULL,
    precio_compra DECIMAL(10,2) NOT NULL,
    precio_venta DECIMAL(10,2) NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categoria (id_categoria),
    INDEX idx_nombre (nombre),
    INDEX idx_codigo (codigo),
    FOREIGN KEY (id_categoria) REFERENCES categorias(id)
) ENGINE=InnoDB;

-- =========================================
-- INVENTARIO
-- =========================================
CREATE TABLE inventario (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_producto INT UNSIGNED NOT NULL,
    stock INT UNSIGNED DEFAULT 0,
    stock_minimo INT UNSIGNED DEFAULT 5,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX uk_producto (id_producto),
    FOREIGN KEY (id_producto) REFERENCES productos(id)
) ENGINE=InnoDB;

-- =========================================
-- MOVIMIENTOS (KARDEX)
-- =========================================
CREATE TABLE movimientos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_producto INT UNSIGNED NOT NULL,
    tipo ENUM('ENTRADA','SALIDA') NOT NULL,
    cantidad INT UNSIGNED NOT NULL,
    descripcion VARCHAR(255),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_producto (id_producto),
    INDEX idx_tipo (tipo),
    FOREIGN KEY (id_producto) REFERENCES productos(id)
) ENGINE=InnoDB;

-- =========================================
-- FACTURA (ENCABEZADO)
-- =========================================
CREATE TABLE factura (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT UNSIGNED,
    id_usuario INT UNSIGNED NOT NULL,
    total DECIMAL(10,2) DEFAULT 0,
    estado ENUM('PENDIENTE','PAGADA','ANULADA') DEFAULT 'PENDIENTE',
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cliente (id_cliente),
    INDEX idx_usuario (id_usuario),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- =========================================
-- DETALLE FACTURA
-- =========================================
CREATE TABLE factura_detalle (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_factura INT UNSIGNED NOT NULL,
    id_producto INT UNSIGNED NOT NULL,
    cantidad INT UNSIGNED NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    INDEX idx_factura (id_factura),
    INDEX idx_producto (id_producto),
    FOREIGN KEY (id_factura) REFERENCES factura(id),
    FOREIGN KEY (id_producto) REFERENCES productos(id)
) ENGINE=InnoDB;


CREATE TABLE metodos_pago (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

INSERT INTO metodos_pago (nombre) VALUES
('Efectivo'),
('SINPE'),
('Tarjeta'),
('Transferencia');


-- ==== 
-- inserte persona
-- ========

INSERT INTO persona (nombre, apellido, telefono, correo, direccion) VALUES
('Ana','Lopez','88881111','ana@gmail.com','San José'),
('Carlos','Perez','88882222','carlos@gmail.com','Alajuela'),
('Maria','Gomez','88883333','maria@gmail.com','Cartago'),
('Luis','Rodriguez','88884444','luis@gmail.com','Heredia'),
('Sofia','Ramirez','88885555','sofia@gmail.com','San José'),
('Pedro','Sanchez','88886666','pedro@gmail.com','Puntarenas'),
('Laura','Fernandez','88887777','laura@gmail.com','Limón'),
('Jorge','Castro','88888888','jorge@gmail.com','San José'),
('Elena','Mora','88889999','elena@gmail.com','Cartago'),
('David','Vargas','88880000','david@gmail.com','Heredia');

-- CLIENTES INSERT 
INSERT INTO clientes (id_persona) VALUES
(1),(2),(3),(4),(5);

-- PROVEEDORES
INSERT INTO proveedores (id_persona, empresa) VALUES
(6,'Belleza CR'),
(7,'Cosmeticos Premium'),
(8,'Distribuidora Glam'),
(9,'Makeup Supply'),
(10,'Estetica Total');

-- Usuario 
INSERT INTO proveedores (id_persona, empresa) VALUES
(6,'Belleza CR'),
(7,'Cosmeticos Premium'),
(8,'Distribuidora Glam'),
(9,'Makeup Supply'),
(10,'Estetica Total');

-- Tienda 
INSERT INTO tienda (nombre, direccion, telefono) VALUES
('Beauty Store','San José Centro','22223333');

-- Horarios
INSERT INTO horarios (id_tienda, dia, hora_apertura, hora_cierre) VALUES
(1,'LUNES','09:00','18:00'),
(1,'MARTES','09:00','18:00'),
(1,'MIERCOLES','09:00','18:00'),
(1,'JUEVES','09:00','18:00'),
(1,'VIERNES','09:00','18:00'),
(1,'SABADO','09:00','18:00');

-- Categoria 
INSERT INTO categorias (nombre) VALUES
('Labiales'),
('Esmaltes'),
('Pinceles'),
('Maquillaje'),
('Accesorios');

-- PRODUCTO 
INSERT INTO productos (codigo, nombre, id_categoria, precio_compra, precio_venta) VALUES
('LAB001','Labial Rojo Mate',1,2000,3500),
('LAB002','Labial Nude',1,1800,3200),
('ESM001','Esmalte Rojo',2,1000,2000),
('ESM002','Esmalte Transparente',2,900,1800),
('PIN001','Brocha Grande',3,2500,4500),
('PIN002','Pincel Delineador',3,1500,3000),
('MAQ001','Base Líquida',4,5000,8000),
('MAQ002','Polvo Compacto',4,4000,7000),
('ACC001','Espejo Pequeño',5,1200,2500),
('ACC002','Cosmetiquera',5,3000,6000);

-- INVENTARIO 
INSERT INTO inventario (id_producto, stock, stock_minimo) VALUES
(1,50,5),
(2,40,5),
(3,60,10),
(4,30,5),
(5,20,3),
(6,25,3),
(7,15,2),
(8,10,2),
(9,35,5),
(10,12,2);

-- MOVIMIENTOS 
INSERT INTO movimientos (id_producto, tipo, cantidad, descripcion) VALUES
(1,'ENTRADA',50,'Stock inicial'),
(2,'ENTRADA',40,'Stock inicial'),
(3,'ENTRADA',60,'Stock inicial'),
(4,'ENTRADA',30,'Stock inicial'),
(5,'ENTRADA',20,'Stock inicial');

INSERT INTO usuarios (id_persona, usuario, contrasena, id_rol) VALUES
(1,'admin','1234',1),
(2,'vendedor1','1234',2),
(3,'vendedor2','1234',2);

-- FACTURA 
INSERT INTO factura (id_cliente, id_usuario, total, estado) VALUES
(1,2,7000,'PAGADA'),
(2,2,5000,'PAGADA');

INSERT INTO factura_detalle (id_factura, id_producto, cantidad, precio, subtotal) VALUES
(1,1,2,3500,7000),
(2,3,2,2500,5000);

SELECT * FROM roles;
select * from persona;

INSERT INTO persona (nombre, apellido, telefono, correo, direccion) VALUES
('Yensi','Quiros','9696969','yena@gmail.com','San José');

ALTER TABLE factura 
ADD COLUMN id_metodo_pago INT,
ADD CONSTRAINT fk_metodo_pago 
FOREIGN KEY (id_metodo_pago) REFERENCES metodos_pago(id);

ALTER TABLE movimientos
ADD COLUMN referencia VARCHAR(100),
ADD COLUMN id_factura INT;

ALTER TABLE inventario 
ADD UNIQUE (id_producto);


DELIMITER //

CREATE TRIGGER descontar_stock
AFTER INSERT ON factura_detalle
FOR EACH ROW
BEGIN
    UPDATE inventario
    SET stock = stock - NEW.cantidad
    WHERE id_producto = NEW.id_producto;

    INSERT INTO movimientos (id_producto, tipo, cantidad, descripcion, fecha, referencia, id_factura)
    VALUES (
        NEW.id_producto,
        'salida',
        NEW.cantidad,
        'Venta realizada',
        NOW(),
        CONCAT('Factura #', NEW.id_factura),
        NEW.id_factura
    );
END //

DELIMITER ;

DELIMITER //

-- CONTROL DE STOCK NEGATIVO

DELIMITER //

CREATE TRIGGER evitar_stock_negativo
BEFORE INSERT ON factura_detalle
FOR EACH ROW
BEGIN
    DECLARE stock_actual INT;

    SELECT stock INTO stock_actual
    FROM inventario
    WHERE id_producto = NEW.id_producto;

    IF stock_actual < NEW.cantidad THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Stock insuficiente';
    END IF;
END //

DELIMITER ;


-- 🔥 1. AGREGAR TIPO A PERSONA
ALTER TABLE persona 
ADD COLUMN tipo ENUM('cliente','usuario','proveedor') DEFAULT 'cliente';


-- 🔥 2. ACTUALIZAR PERSONAS EXISTENTES

-- Usuarios actuales
UPDATE persona p
INNER JOIN usuarios u ON u.id_persona = p.id
SET p.tipo = 'usuario';

-- Las demás quedan como cliente automáticamente


-- 🔥 3. CREAR CLIENTE CONTADO
INSERT INTO persona (nombre, apellido, telefono, correo, direccion, tipo)
VALUES ('CLIENTE', 'CONTADO', '-', '-', '-', 'cliente');


-- 🔥 4. ASEGURAR FACTURA CON CLIENTE
ALTER TABLE factura 
ADD COLUMN id_cliente INT;

