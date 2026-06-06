// plugins/trivia.js
import { addKryons, addXp, getEconomy, isRegistered } from '../core/sqlite.js'
import { getRealJid, cleanNumber } from '../utils/jid.js'

const sesiones = new Map()

const preguntas = [
    { q: "¿Cuál es el río más largo del mundo?", o: ['Río Nilo', 'Río Amazonas', 'Río Misisipi', 'Río Yangtsé', 'Río Danubio'], a: 'Río Amazonas' },
    { q: "¿Quién pintó la famosa obra de la 'Mona Lisa'?", o: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Miguel Ángel', 'Claude Monet'], a: 'Leonardo da Vinci' },
    { q: "¿Cuál es el océano más grande del planeta?", o: ['Atlántico', 'Índico', 'Ártico', 'Pacífico', 'Antártico'], a: 'Pacífico' },
    { q: "¿Dónde nacieron los Juegos Olímpicos antiguos?", o: ['Italia', 'Egipto', 'Grecia', 'Francia', 'Roma'], a: 'Grecia' },
    { q: "¿Planeta más cercano al Sol?", o: ['Venus', 'Marte', 'Mercurio', 'Júpiter', 'Neptuno'], a: 'Mercurio' },
    { q: "¿Quién creó la Teoría de la Relatividad?", o: ['Newton', 'Einstein', 'Galileo', 'Tesla', 'Hawking'], a: 'Einstein' },
    { q: "¿País más grande del mundo?", o: ['Canadá', 'China', 'USA', 'Rusia', 'Brasil'], a: 'Rusia' },
    { q: "¿Hueso más largo del cuerpo humano?", o: ['Fémur', 'Radio', 'Cúbito', 'Tibia', 'Esternón'], a: 'Fémur' },
    { q: "¿Qué animal es conocido como el 'Rey de la Selva'?", o: ['Tigre', 'León', 'Elefante', 'Jaguar', 'Gorila'], a: 'León' },
    { q: "¿Cuál es el idioma más hablado del mundo?", o: ['Inglés', 'Mandarín', 'Español', 'Hindi', 'Árabe'], a: 'Mandarín' },
    { q: "¿Qué vitamina produce el cuerpo cuando nos exponemos al sol?", o: ['Vitamina A', 'Vitamina B12', 'Vitamina C', 'Vitamina D', 'Vitamina E'], a: 'Vitamina D' },
    { q: "¿Cuál es el metal más liviano?", o: ['Hierro', 'Cobre', 'Aluminio', 'Litio', 'Oro'], a: 'Litio' },
    { q: "¿Capital de Honduras?", o: ['San Pedro Sula', 'Tegucigalpa', 'La Ceiba', 'Comayagua', 'Choluteca'], a: 'Tegucigalpa' },
    { q: "¿Quién escribió 'Cien años de soledad'?", o: ['Mario Vargas Llosa', 'Gabriel García Márquez', 'Julio Cortázar', 'Pablo Neruda', 'Octavio Paz'], a: 'Gabriel García Márquez' },
    { q: "¿De qué color es el caballo blanco de Napoleón?", o: ['Negro', 'Marrón', 'Gris', 'Blanco', 'Dorado'], a: 'Blanco' },
    { q: "¿Qué país tiene forma de bota?", o: ['Francia', 'Italia', 'España', 'Portugal', 'Grecia'], a: 'Italia' },
    { q: "¿Cuál es la montaña más alta del mundo?", o: ['K2', 'Kangchenjunga', 'Makalu', 'Everest', 'Lhotse'], a: 'Everest' },
    { q: "¿Cuál es el planeta más grande del sistema solar?", o: ['Saturno', 'Júpiter', 'Neptuno', 'Urano', 'Tierra'], a: 'Júpiter' },
    { q: "¿Quién descubrió América?", o: ['Magallanes', 'Elcano', 'Colón', 'Pizarro', 'Cortés'], a: 'Colón' },
    { q: "¿Cuál es el mamífero terrestre más grande?", o: ['Elefante', 'Jirafa', 'Hipopótamo', 'Rinoceronte', 'Ballena'], a: 'Elefante' },
    { q: "¿Qué instrumento toca el virtuoso Gustavo Cerati?", o: ['Piano', 'Batería', 'Guitarra', 'Bajo', 'Violín'], a: 'Guitarra' },
    { q: "¿Cuál es el libro más vendido del mundo?", o: ['El Quijote', 'La Biblia', 'Cien años', 'Harry Potter', 'El Principito'], a: 'La Biblia' },
    { q: "¿Qué país es famoso por las pirámides?", o: ['México', 'Egipto', 'Sudán', 'Irak', 'China'], a: 'Egipto' },
    { q: "¿Cuál es el pájaro que no vuela?", o: ['Águila', 'Colibrí', 'Pingüino', 'Loro', 'Halcón'], a: 'Pingüino' },
    { q: "¿Cuántos años tiene el cero en un partido de fútbol?", o: ['2', '3', '1', '4', '5'], a: '1' },
    { q: "¿Qué organización tiene como logo un panda?", o: ['Greenpeace', 'WWF', 'Unicef', 'ONU', 'OEA'], a: 'WWF' },
    { q: "¿Cuál es el animal más venenoso del mundo?", o: ['Serpiente', 'Avispa', 'Rana', 'Escorpión', 'Medusa'], a: 'Medusa' },
    { q: "¿Qué deporte se juega con un volante?", o: ['Bádminton', 'Tenis', 'Pádel', 'Squash', 'Frontón'], a: 'Bádminton' },
    { q: "¿País con más volcanes activos?", o: ['Japón', 'Indonesia', 'Chile', 'Rusia', 'EE. UU.'], a: 'Indonesia' },
    { q: "¿Cuál es la moneda oficial de Japón?", o: ['Yuan', 'Dólar', 'Yen', 'Won', 'Ringgit'], a: 'Yen' },
    { q: "¿Cuál es el idioma oficial de Brasil?", o: ['Español', 'Portugués', 'Inglés', 'Francés', 'Italiano'], a: 'Portugués' },
    { q: "¿Qué científico desarrolló la penicilina?", o: ['Pasteur', 'Fleming', 'Koch', 'Ehrlich', 'Salk'], a: 'Fleming' },
    { q: "¿Animal de la suerte en la cultura china?", o: ['Dragón', 'Tigre', 'Serpiente', 'Mono', 'Rata'], a: 'Dragón' },
    { q: "¿Cuál es la fruta con más vitamina C?", o: ['Naranja', 'Limón', 'Kiwi', 'Guayaba', 'Fresa'], a: 'Guayaba' },
    { q: "¿Plaza principal de Honduras?", o: ['Parque Central', 'Plaza Morazán', 'Plaza Libertad', 'Plaza Civica', 'Plaza San Martín'], a: 'Plaza Morazán' },
    { q: "¿Capital de Francia?", o: ['Lyon', 'Marsella', 'París', 'Burdeos', 'Toulouse'], a: 'París' },
    { q: "¿Cuál es el animal más rápido del mundo?", o: ['Guepardo', 'León', 'Tigre', 'Antílope', 'Avestruz'], a: 'Guepardo' },
    { q: "¿Qué mide la escala Richter?", o: ['Viento', 'Terremotos', 'Temperatura', 'Presión', 'Densidad'], a: 'Terremotos' },
    { q: "¿Cuál es la capa más externa de la Tierra?", o: ['Manto', 'Corteza', 'Núcleo', 'Litosfera', 'Atmósfera'], a: 'Corteza' },
    { q: "¿Qué instrumento mide el tiempo?", o: ['Termómetro', 'Barómetro', 'Reloj', 'Velocímetro', 'Altímetro'], a: 'Reloj' },
    { q: "¿Cuál es el río más caudaloso del mundo?", o: ['Nilo', 'Amazonas', 'Yangtsé', 'Misisipi', 'Yenisei'], a: 'Amazonas' },
    { q: "¿Cuál es el país más poblado del mundo?", o: ['India', 'China', 'EE. UU.', 'Indonesia', 'Pakistán'], a: 'India' },
    { q: "¿Quién escribió 'Romeo y Julieta'?", o: ['Chaucer', 'Shakespeare', 'Dickens', 'Austen', 'Hemingway'], a: 'Shakespeare' },
    { q: "¿Qué gas es esencial para la respiración?", o: ['Nitrógeno', 'CO2', 'Oxígeno', 'Hidrógeno', 'Helio'], a: 'Oxígeno' },
    { q: "¿Cuál es el deporte más popular del mundo?", o: ['Cricket', 'Béisbol', 'Fútbol', 'Tenis', 'Baloncesto'], a: 'Fútbol' },
    { q: "¿Cuál es el continente más poblado?", o: ['África', 'Europa', 'América', 'Asia', 'Oceanía'], a: 'Asia' },
    { q: "¿Qué país tiene la Torre Eiffel?", o: ['Italia', 'España', 'Francia', 'Inglaterra', 'Alemania'], a: 'Francia' },
    { q: "¿Cuál es el único mamífero que vuela?", o: ['Murciélago', 'Ornitorrinco', 'Ardilla', 'Pereza', 'Topo'], a: 'Murciélago' },
    { q: "¿Capital de España?", o: ['Barcelona', 'Valencia', 'Sevilla', 'Madrid', 'Bilbao'], a: 'Madrid' },
    { q: "¿Cuántos colores tiene el arcoíris?", o: ['5', '6', '7', '8', '9'], a: '7' },
    { q: "¿Qué animal es conocido como el 'camello del desierto'?", o: ['Camello', 'Dromedario', 'Llama', 'Alpaca', 'Guanaco'], a: 'Dromedario' },
    { q: "¿Cuál es la galaxia donde vivimos?", o: ['Andrómeda', 'Triangulum', 'Via Láctea', 'Remolino', 'Sombrero'], a: 'Via Láctea' },
    { q: "¿Qué número es el Pi (π) aproximadamente?", o: ['2.14', '3.14', '4.14', '5.14', '6.14'], a: '3.14' },
    { q: "¿Cuál es el país con más premios Nobel?", o: ['EE. UU.', 'Reino Unido', 'Alemania', 'Francia', 'Suecia'], a: 'EE. UU.' },
    { q: "¿Quién pintó 'La noche estrellada'?", o: ['Picasso', 'Monet', 'Van Gogh', 'Dalí', 'Rembrandt'], a: 'Van Gogh' },
    { q: "¿Cuál es el metal más caro del mundo?", o: ['Oro', 'Platino', 'Rodio', 'Paladio', 'Plata'], a: 'Rodio' },
    { q: "¿Qué animal tiene tres corazones?", o: ['Pulpo', 'Jibia', 'Sepia', 'Calamar', 'Babosa'], a: 'Pulpo' },
    { q: "¿Capital de Argentina?", o: ['Córdoba', 'Rosario', 'Mendoza', 'Buenos Aires', 'La Plata'], a: 'Buenos Aires' },
    { q: "¿Cuál es la flor nacional de Japón?", o: ['Rosa', 'Orquídea', 'Loto', 'Cerezo', 'Jazmín'], a: 'Cerezo' },
    { q: "¿Quién fue el primer hombre en pisar la Luna?", o: ['Aldrin', 'Armstrong', 'Collins', 'Gagarin', 'Shepard'], a: 'Armstrong' },
    { q: "¿Cuál es el hueso más pequeño del cuerpo humano?", o: ['Martillo', 'Yunque', 'Estribo', 'Tímpano', 'Lentes'], a: 'Estribo' },
    { q: "¿Qué país tiene la Gran Muralla?", o: ['Japón', 'Corea', 'India', 'China', 'Mongolia'], a: 'China' },
    { q: "¿Cuál es el animal más longevo del mundo?", o: ['Tortuga', 'Ballena', 'Elefante', 'Medusa', 'Loro'], a: 'Tortuga' },
    { q: "¿Capital de Italia?", o: ['Milán', 'Nápoles', 'Florencia', 'Roma', 'Venecia'], a: 'Roma' },
    { q: "¿Qué científico descubrió la gravedad?", o: ['Einstein', 'Newton', 'Galileo', 'Copérnico', 'Kepler'], a: 'Newton' },
    { q: "¿Cuál es el país más pequeño del mundo?", o: ['Mónaco', 'San Marino', 'Vaticano', 'Nauru', 'Tuvalu'], a: 'Vaticano' },
    { q: "¿Qué color representa la bandera LGBT?", o: ['Verde', 'Azul', 'Arcoíris', 'Amarillo', 'Morado'], a: 'Arcoíris' },
    { q: "¿Cuál es la montaña más alta de América?", o: ['Kilimanjaro', 'Monte Everest', 'Aconcagua', 'Denali', 'K2'], a: 'Aconcagua' },
    { q: "¿Cuál es el deporte rey en EE. UU.?", o: ['Fútbol', 'Béisbol', 'Baloncesto', 'Fútbol americano', 'Hockey'], a: 'Fútbol americano' },
    { q: "¿Cuál es el metal más común en la Tierra?", o: ['Hierro', 'Aluminio', 'Cobre', 'Zinc', 'Plomo'], a: 'Hierro' },
    { q: "¿Cuál es el río más largo del mundo?", o: ['Río Nilo', 'Río Amazonas', 'Río Misisipi', 'Río Yangtsé', 'Río Danubio'], a: 'Río Amazonas' },
    { q: "¿Quién pintó la famosa obra de la 'Mona Lisa'?", o: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Miguel Ángel', 'Claude Monet'], a: 'Leonardo da Vinci' },
    { q: "¿Cuál es el océano más grande del planeta?", o: ['Atlántico', 'Índico', 'Ártico', 'Pacífico', 'Antártico'], a: 'Pacífico' },
    { q: "¿Dónde nacieron los Juegos Olímpicos antiguos?", o: ['Italia', 'Egipto', 'Grecia', 'Francia', 'Roma'], a: 'Grecia' },
    { q: "¿Planeta más cercano al Sol?", o: ['Venus', 'Marte', 'Mercurio', 'Júpiter', 'Neptuno'], a: 'Mercurio' },
    { q: "¿Quién creó la Teoría de la Relatividad?", o: ['Newton', 'Einstein', 'Galileo', 'Tesla', 'Hawking'], a: 'Einstein' },
    { q: "¿País más grande del mundo?", o: ['Canadá', 'China', 'USA', 'Rusia', 'Brasil'], a: 'Rusia' },
    { q: "¿Hueso más largo del cuerpo humano?", o: ['Fémur', 'Radio', 'Cúbito', 'Tibia', 'Esternón'], a: 'Fémur' },
    { q: "¿Qué animal es conocido como el 'Rey de la Selva'?", o: ['Tigre', 'León', 'Elefante', 'Jaguar', 'Gorila'], a: 'León' },
    { q: "¿Cuál es el idioma más hablado del mundo?", o: ['Inglés', 'Mandarín', 'Español', 'Hindi', 'Árabe'], a: 'Mandarín' },
    { q: "¿Qué vitamina produce el cuerpo cuando nos exponemos al sol?", o: ['Vitamina A', 'Vitamina B12', 'Vitamina C', 'Vitamina D', 'Vitamina E'], a: 'Vitamina D' },
    { q: "¿Cuál es el metal más liviano?", o: ['Hierro', 'Cobre', 'Aluminio', 'Litio', 'Oro'], a: 'Litio' },
    { q: "¿Capital de Honduras?", o: ['San Pedro Sula', 'Tegucigalpa', 'La Ceiba', 'Comayagua', 'Choluteca'], a: 'Tegucigalpa' },
    { q: "¿Quién escribió 'Cien años de soledad'?", o: ['Mario Vargas Llosa', 'Gabriel García Márquez', 'Julio Cortázar', 'Pablo Neruda', 'Octavio Paz'], a: 'Gabriel García Márquez' },
    { q: "¿De qué color es el caballo blanco de Napoleón?", o: ['Negro', 'Marrón', 'Gris', 'Blanco', 'Dorado'], a: 'Blanco' },
    { q: "¿Qué país tiene forma de bota?", o: ['Francia', 'Italia', 'España', 'Portugal', 'Grecia'], a: 'Italia' },
    { q: "¿Cuál es la montaña más alta del mundo?", o: ['K2', 'Kangchenjunga', 'Makalu', 'Everest', 'Lhotse'], a: 'Everest' },
    { q: "¿Cuál es el planeta más grande del sistema solar?", o: ['Saturno', 'Júpiter', 'Neptuno', 'Urano', 'Tierra'], a: 'Júpiter' },
    { q: "¿Quién descubrió América?", o: ['Magallanes', 'Elcano', 'Colón', 'Pizarro', 'Cortés'], a: 'Colón' },
    { q: "¿Cuál es el mamífero terrestre más grande?", o: ['Elefante', 'Jirafa', 'Hipopótamo', 'Rinoceronte', 'Ballena'], a: 'Elefante' },
    { q: "¿Qué instrumento toca el virtuoso Gustavo Cerati?", o: ['Piano', 'Batería', 'Guitarra', 'Bajo', 'Violín'], a: 'Guitarra' },
    { q: "¿Cuál es el libro más vendido del mundo?", o: ['El Quijote', 'La Biblia', 'Cien años', 'Harry Potter', 'El Principito'], a: 'La Biblia' },
    { q: "¿Qué país es famoso por las pirámides?", o: ['México', 'Egipto', 'Sudán', 'Irak', 'China'], a: 'Egipto' },
    { q: "¿Cuál es el pájaro que no vuela?", o: ['Águila', 'Colibrí', 'Pingüino', 'Loro', 'Halcón'], a: 'Pingüino' },
    { q: "¿Cuántos años tiene el cero en un partido de fútbol?", o: ['2', '3', '1', '4', '5'], a: '1' },
    { q: "¿Qué organización tiene como logo un panda?", o: ['Greenpeace', 'WWF', 'Unicef', 'ONU', 'OEA'], a: 'WWF' },
    { q: "¿Cuál es el animal más venenoso del mundo?", o: ['Serpiente', 'Avispa', 'Rana', 'Escorpión', 'Medusa'], a: 'Medusa' },
    { q: "¿Qué deporte se juega con un volante?", o: ['Bádminton', 'Tenis', 'Pádel', 'Squash', 'Frontón'], a: 'Bádminton' },
    { q: "¿País con más volcanes activos?", o: ['Japón', 'Indonesia', 'Chile', 'Rusia', 'EE. UU.'], a: 'Indonesia' },
    { q: "¿Cuál es la moneda oficial de Japón?", o: ['Yuan', 'Dólar', 'Yen', 'Won', 'Ringgit'], a: 'Yen' },
    { q: "¿Cuál es el idioma oficial de Brasil?", o: ['Español', 'Portugués', 'Inglés', 'Francés', 'Italiano'], a: 'Portugués' },
    { q: "¿Qué científico desarrolló la penicilina?", o: ['Pasteur', 'Fleming', 'Koch', 'Ehrlich', 'Salk'], a: 'Fleming' },
    { q: "¿Animal de la suerte en la cultura china?", o: ['Dragón', 'Tigre', 'Serpiente', 'Mono', 'Rata'], a: 'Dragón' },
    { q: "¿Cuál es la fruta con más vitamina C?", o: ['Naranja', 'Limón', 'Kiwi', 'Guayaba', 'Fresa'], a: 'Guayaba' },
    { q: "¿Plaza principal de Honduras?", o: ['Parque Central', 'Plaza Morazán', 'Plaza Libertad', 'Plaza Civica', 'Plaza San Martín'], a: 'Plaza Morazán' },
    { q: "¿Capital de Francia?", o: ['Lyon', 'Marsella', 'París', 'Burdeos', 'Toulouse'], a: 'París' },
    { q: "¿Cuál es el animal más rápido del mundo?", o: ['Guepardo', 'León', 'Tigre', 'Antílope', 'Avestruz'], a: 'Guepardo' },
    { q: "¿Qué mide la escala Richter?", o: ['Viento', 'Terremotos', 'Temperatura', 'Presión', 'Densidad'], a: 'Terremotos' },
    { q: "¿Cuál es la capa más externa de la Tierra?", o: ['Manto', 'Corteza', 'Núcleo', 'Litosfera', 'Atmósfera'], a: 'Corteza' },
    { q: "¿Qué instrumento mide el tiempo?", o: ['Termómetro', 'Barómetro', 'Reloj', 'Velocímetro', 'Altímetro'], a: 'Reloj' },
    { q: "¿Cuál es el río más caudaloso del mundo?", o: ['Nilo', 'Amazonas', 'Yangtsé', 'Misisipi', 'Yenisei'], a: 'Amazonas' },
    { q: "¿Cuál es el país más poblado del mundo?", o: ['India', 'China', 'EE. UU.', 'Indonesia', 'Pakistán'], a: 'India' },
    { q: "¿Quién escribió 'Romeo y Julieta'?", o: ['Chaucer', 'Shakespeare', 'Dickens', 'Austen', 'Hemingway'], a: 'Shakespeare' },
    { q: "¿Qué gas es esencial para la respiración?", o: ['Nitrógeno', 'CO2', 'Oxígeno', 'Hidrógeno', 'Helio'], a: 'Oxígeno' },
    { q: "¿Cuál es el deporte más popular del mundo?", o: ['Cricket', 'Béisbol', 'Fútbol', 'Tenis', 'Baloncesto'], a: 'Fútbol' },
    { q: "¿Cuál es el continente más poblado?", o: ['África', 'Europa', 'América', 'Asia', 'Oceanía'], a: 'Asia' },
    { q: "¿Qué país tiene la Torre Eiffel?", o: ['Italia', 'España', 'Francia', 'Inglaterra', 'Alemania'], a: 'Francia' },
    { q: "¿Cuál es el único mamífero que vuela?", o: ['Murciélago', 'Ornitorrinco', 'Ardilla', 'Pereza', 'Topo'], a: 'Murciélago' },
    { q: "¿Capital de España?", o: ['Barcelona', 'Valencia', 'Sevilla', 'Madrid', 'Bilbao'], a: 'Madrid' },
    { q: "¿Cuántos colores tiene el arcoíris?", o: ['5', '6', '7', '8', '9'], a: '7' },
    { q: "¿Qué animal es conocido como el 'camello del desierto'?", o: ['Camello', 'Dromedario', 'Llama', 'Alpaca', 'Guanaco'], a: 'Dromedario' },
    { q: "¿Cuál es la galaxia donde vivimos?", o: ['Andrómeda', 'Triangulum', 'Via Láctea', 'Remolino', 'Sombrero'], a: 'Via Láctea' },
    { q: "¿Qué número es el Pi (π) aproximadamente?", o: ['2.14', '3.14', '4.14', '5.14', '6.14'], a: '3.14' },
    { q: "¿Cuál es el país con más premios Nobel?", o: ['EE. UU.', 'Reino Unido', 'Alemania', 'Francia', 'Suecia'], a: 'EE. UU.' },
    { q: "¿Quién pintó 'La noche estrellada'?", o: ['Picasso', 'Monet', 'Van Gogh', 'Dalí', 'Rembrandt'], a: 'Van Gogh' },
    { q: "¿Cuál es el metal más caro del mundo?", o: ['Oro', 'Platino', 'Rodio', 'Paladio', 'Plata'], a: 'Rodio' },
    { q: "¿Qué animal tiene tres corazones?", o: ['Pulpo', 'Jibia', 'Sepia', 'Calamar', 'Babosa'], a: 'Pulpo' },
    { q: "¿Capital de Argentina?", o: ['Córdoba', 'Rosario', 'Mendoza', 'Buenos Aires', 'La Plata'], a: 'Buenos Aires' },
    { q: "¿Cuál es la flor nacional de Japón?", o: ['Rosa', 'Orquídea', 'Loto', 'Cerezo', 'Jazmín'], a: 'Cerezo' },
    { q: "¿Quién fue el primer hombre en pisar la Luna?", o: ['Aldrin', 'Armstrong', 'Collins', 'Gagarin', 'Shepard'], a: 'Armstrong' },
    { q: "¿Cuál es el hueso más pequeño del cuerpo humano?", o: ['Martillo', 'Yunque', 'Estribo', 'Tímpano', 'Lentes'], a: 'Estribo' },
    { q: "¿Qué país tiene la Gran Muralla?", o: ['Japón', 'Corea', 'India', 'China', 'Mongolia'], a: 'China' },
    { q: "¿Cuál es el animal más longevo del mundo?", o: ['Tortuga', 'Ballena', 'Elefante', 'Medusa', 'Loro'], a: 'Tortuga' },
    { q: "¿Capital de Italia?", o: ['Milán', 'Nápoles', 'Florencia', 'Roma', 'Venecia'], a: 'Roma' },
    { q: "¿Qué científico descubrió la gravedad?", o: ['Einstein', 'Newton', 'Galileo', 'Copérnico', 'Kepler'], a: 'Newton' },
    { q: "¿Cuál es el país más pequeño del mundo?", o: ['Mónaco', 'San Marino', 'Vaticano', 'Nauru', 'Tuvalu'], a: 'Vaticano' },
    { q: "¿Qué color representa la bandera LGBT?", o: ['Verde', 'Azul', 'Arcoíris', 'Amarillo', 'Morado'], a: 'Arcoíris' },
    { q: "¿Cuál es la montaña más alta de América?", o: ['Kilimanjaro', 'Monte Everest', 'Aconcagua', 'Denali', 'K2'], a: 'Aconcagua' },
    { q: "¿Cuál es el deporte rey en EE. UU.?", o: ['Fútbol', 'Béisbol', 'Baloncesto', 'Fútbol americano', 'Hockey'], a: 'Fútbol americano' },
    { q: "¿Cuál es el metal más común en la Tierra?", o: ['Hierro', 'Aluminio', 'Cobre', 'Zinc', 'Plomo'], a: 'Hierro' }
];

function desordenarOpciones(array) {
    return array.sort(() => Math.random() - 0.5)
}

export default {
    command: ['trivia'],
    tag: 'trivia',
    categoria: 'juego',
    owner: false,
    group: false,
    nsfw: false,
    descripcion: '🌸 Responde una pregunta aleatoria de trivia y gana premios',

    async onMessage(sock, msg, { from, text, userNum }) {
        const sesion = sesiones.get(userNum)
        if (!sesion) return

        const ahora = Date.now()
        if (sesion.ultimoMensaje && (ahora - sesion.ultimoMensaje < 1200)) {
            return
        }
        sesion.ultimoMensaje = ahora

        const entrada = text?.trim()
        if (!entrada) return

        if (entrada.toLowerCase() === 'cancelar') {
            sesiones.delete(userNum)
            await sock.sendMessage(from, { text: '> 🌸 Juego cancelado. ¡Nos vemos luego!' }, { quoted: msg })
            return
        }

        const seleccion = parseInt(entrada)
        if (isNaN(seleccion) || seleccion < 1 || seleccion > 5) {
            return 
        }

        const respuestaUsuario = sesion.opciones[seleccion - 1]

        if (respuestaUsuario === sesion.respuestaCorrecta) {
            const premioKryons = Math.floor(Math.random() * (350 - 150 + 1)) + 150
            const premioXp = Math.floor(premioKryons / 5)

            addKryons(userNum, premioKryons)
            addXp(userNum, premioXp)
            sesiones.delete(userNum)

            let txtWin = `> 🌸 ¡Excelente elección! La respuesta correcta era efectivamente *${sesion.respuestaCorrecta}*.\n\n`
            txtWin += `> ✦ Recompensa: *+${premioKryons} kryons* ✨\n`
            txtWin += `> ✦ Exp: *+${premioXp} XP*`

            await sock.sendMessage(from, { react: { text: '🎉', key: msg.key } })
            await sock.sendMessage(from, { text: txtWin }, { quoted: msg })
        } else {
            sesiones.delete(userNum)

            let txtFail = `> 🌸 ¡Incorrecto! Te has equivocado. La respuesta correcta era: *${sesion.respuestaCorrecta}*.\n\n`
            txtFail += `> 🌿 Suerte para la próxima.`

            await sock.sendMessage(from, { react: { text: '❌', key: msg.key } })
            await sock.sendMessage(from, { text: txtFail }, { quoted: msg })
        }
    },

    async execute(sock, msg, { from, userNum, sender }) {
        const selfJid = await getRealJid(sock, sender, msg).catch(() => sender)
        const selfNum = cleanNumber(selfJid)

        if (!isRegistered(selfNum)) {
            return sock.sendMessage(from, { text: global.messages.notRegistered }, { quoted: msg })
        }

        if (sesiones.has(selfNum)) {
            return sock.sendMessage(from, { text: '🌸 Ya tienes una trivia activa. Responde o escribe *cancelar*.' }, { quoted: msg })
        }

        const preguntaSeleccionada = preguntas[Math.floor(Math.random() * preguntas.length)]
        const opcionesDesordenadas = desordenarOpciones([...preguntaSeleccionada.o])

        sesiones.set(selfNum, {
            respuestaCorrecta: preguntaSeleccionada.a,
            opciones: opcionesDesordenadas,
            ultimoMensaje: 0
        })

        let txtInicio = `> 🧠 *Pregunta:* ${preguntaSeleccionada.q}\n\n`
        
        opcionesDesordenadas.forEach((opcion, index) => {
            txtInicio += `*${index + 1}*. ${opcion}\n`
        })
        
        txtInicio += `\n> 🌿 Responde únicamente con el *número* de tu opción (1-5) o escribe *cancelar*.`

        await sock.sendMessage(from, { text: txtInicio }, { quoted: msg })
    }
}