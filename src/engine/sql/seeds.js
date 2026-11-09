// Bases de datos de práctica, con el modelo de datos de los supuestos
// reales del examen:
//   - becas: supuesto I de 2024 (concesión de becas para opositores)
//   - educa: supuesto I de 2025 (EDUCA-DATA 2030)
// Los datos son inventados, pero pensados para que las consultas de las
// lecciones den resultados con sentido (alumnos sin matrícula, ficheros que
// no son PDF, etc.).

export const BECAS = `
CREATE TABLE Interesado (
  IdInteresado INTEGER PRIMARY KEY,
  DocumentoIdentidad VARCHAR(9) NOT NULL UNIQUE,
  Nombre VARCHAR(100) NOT NULL,
  Apellido1 VARCHAR(100),
  Apellido2 VARCHAR(100),
  Email VARCHAR(100)
);
CREATE TABLE CuerpoBecado (
  IdCuerpoBecado INTEGER PRIMARY KEY,
  Codigo VARCHAR(10) NOT NULL UNIQUE,
  Denominacion VARCHAR(100) NOT NULL
);
CREATE TABLE Estado (
  IdEstado INTEGER PRIMARY KEY,
  Codigo VARCHAR(10) NOT NULL UNIQUE,
  Denominacion VARCHAR(100) NOT NULL
);
CREATE TABLE SolicitudBeca (
  IdSolicitudBeca INTEGER PRIMARY KEY,
  IdInteresado INTEGER NOT NULL REFERENCES Interesado(IdInteresado),
  IdCuerpoBecado INTEGER NOT NULL REFERENCES CuerpoBecado(IdCuerpoBecado),
  FechaPresentacion DATETIME,
  IdEstado INTEGER NOT NULL REFERENCES Estado(IdEstado),
  AñoConvocatoria INT NOT NULL
);
CREATE TABLE FicheroAdjunto (
  IdFicheroAdjunto INTEGER PRIMARY KEY,
  IdSolicitudBeca INTEGER NOT NULL REFERENCES SolicitudBeca(IdSolicitudBeca),
  Denominacion VARCHAR(100) NOT NULL
);

INSERT INTO Interesado VALUES
  (1, '00000000T', 'Lucía', 'Martín', 'Gómez', 'lucia@correo.es'),
  (2, '12345678Z', 'Pablo', 'Sánchez', 'Ruiz', 'pablo@correo.es'),
  (3, '87654321X', 'Marta', 'López', 'Díaz', NULL),
  (4, '11111111H', 'Andrés', 'García', 'Pérez', 'andres@correo.es'),
  (5, '22222222J', 'Elena', 'Fernández', NULL, 'elena@correo.es');
INSERT INTO CuerpoBecado VALUES
  (1, 'GSI', 'Gestión de Sistemas e Informática'),
  (2, 'AUX', 'Auxiliar Administrativo'),
  (3, 'ADM', 'Administrativo');
INSERT INTO Estado VALUES
  (1, 'PRE', 'Presentada'),
  (2, 'SUB', 'Pendiente de subsanación'),
  (3, 'CON', 'Concedida'),
  (4, 'DEN', 'Denegada');
INSERT INTO SolicitudBeca VALUES
  (1, 1, 1, '2023-03-10 09:15', 3, 2023),
  (2, 1, 1, '2024-03-02 10:00', 1, 2024),
  (3, 2, 2, '2024-03-05 12:30', 2, 2024),
  (4, 3, 3, '2024-03-06 08:45', 3, 2024),
  (5, 4, 2, '2024-03-07 17:20', 4, 2024),
  (6, 2, 2, '2023-04-01 11:00', 3, 2023);
INSERT INTO FicheroAdjunto VALUES
  (1, 2, 'dni_lucia.pdf'),
  (2, 2, 'titulo_lucia.jpg'),
  (3, 2, 'empadronamiento.docx'),
  (4, 3, 'dni_pablo.pdf'),
  (5, 4, 'dni_marta.pdf'),
  (6, 4, 'renta_marta.pdf'),
  (7, 5, 'foto.png'),
  (8, 1, 'solicitud_2023.pdf');
`;

export const EDUCA = `
CREATE TABLE CENTRO_EDUCATIVO (
  id_centro INTEGER PRIMARY KEY,
  codigo_centro VARCHAR(10) NOT NULL,
  provincia VARCHAR(50) NOT NULL,
  fecha_alta DATE
);
CREATE TABLE PROGRAMA_FORMATIVO (
  id_programa INTEGER PRIMARY KEY,
  id_centro INTEGER NOT NULL REFERENCES CENTRO_EDUCATIVO(id_centro),
  nombre VARCHAR(100) NOT NULL,
  fecha_inicio DATE,
  fecha_fin DATE
);
CREATE TABLE ALUMNO (
  id_alumno INTEGER PRIMARY KEY,
  dni VARCHAR(9),
  fecha_nacimiento DATE,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100)
);
CREATE TABLE MATRICULA (
  id_matricula INTEGER PRIMARY KEY,
  id_alumno INTEGER NOT NULL REFERENCES ALUMNO(id_alumno),
  id_programa INTEGER NOT NULL REFERENCES PROGRAMA_FORMATIVO(id_programa),
  estado VARCHAR(20) NOT NULL
);
CREATE TABLE INDICADOR (
  id_indicador INTEGER PRIMARY KEY,
  id_programa INTEGER REFERENCES PROGRAMA_FORMATIVO(id_programa),
  id_centro INTEGER REFERENCES CENTRO_EDUCATIVO(id_centro),
  id_alumno INTEGER REFERENCES ALUMNO(id_alumno),
  valor REAL,
  fecha_calculo DATE
);

INSERT INTO CENTRO_EDUCATIVO VALUES
  (1, '28000001', 'Madrid', '2015-09-01'),
  (2, '41000002', 'Sevilla', '2018-09-01'),
  (3, '46000003', 'Valencia', '2020-09-01');
INSERT INTO PROGRAMA_FORMATIVO VALUES
  (1, 1, 'Competencia digital docente', '2026-01-10', '2026-06-30'),
  (2, 1, 'Ciberseguridad en el aula', '2026-02-01', '2026-05-31'),
  (3, 2, 'Programación con Python', '2026-01-15', '2026-07-15'),
  (4, 3, 'Robótica educativa', '2026-03-01', '2026-06-15');
INSERT INTO ALUMNO VALUES
  (1, '00000001R', '2008-04-12', 'Ana Torres', 'ana@educa.es'),
  (2, '00000002W', '2007-11-02', 'Luis Moreno', 'luis@educa.es'),
  (3, '00000003A', '2008-01-25', 'Sara Gil', NULL),
  (4, '00000004G', '2009-06-30', 'Hugo Ramos', 'hugo@educa.es'),
  (5, '00000005M', '2008-09-14', 'Irene Vidal', 'irene@educa.es'),
  (6, '00000006Y', '2007-02-18', 'Jorge Peña', NULL);
INSERT INTO MATRICULA VALUES
  (1, 1, 1, 'ACTIVA'),
  (2, 1, 3, 'ACTIVA'),
  (3, 2, 1, 'BAJA'),
  (4, 3, 2, 'ACTIVA'),
  (5, 4, 1, 'ACTIVA'),
  (6, 4, 4, 'FINALIZADA'),
  (7, 5, 3, 'ACTIVA');
INSERT INTO INDICADOR VALUES
  (1, 1, 1, NULL, 0.82, '2026-03-31'),
  (2, 3, 2, NULL, 0.67, '2026-03-31'),
  (3, NULL, NULL, 2, 0.91, '2026-03-31'),
  (4, NULL, 3, NULL, 0.74, '2026-03-31');
`;

export const SEEDS = { becas: BECAS, educa: EDUCA };
