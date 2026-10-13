/**
 * PATRÓN: Uso de herramientas - Tool use
 * ---------------------------
 * El catálogo de cursos NO está en el entrenamiento
 * del modelo. Sin herramientas, el modelo inventa precios y cursos con
 * total confianza o en su defecto, no hace nada.
 * Con herramientas, consulta el dato real.
 */

import { generateText, stepCountIs, tool } from 'ai';
import z from 'zod';
import { createTracer, model } from '../../helpers/index.js';

// ---------------------------------------------------------------------------
//  LA "BASE DE DATOS" — datos que el modelo no puede conocer
// ---------------------------------------------------------------------------

type Course = {
	id: string;
	title: string;
	hours: number;
	priceUSD: number;
	level: 'basic' | 'intermediate' | 'advanced';
	students: number;
};

const COURSE_CATALOG: Course[] = [
	{
		id: 'ts-01',
		title: 'TypeScript desde cero',
		hours: 22,
		priceUSD: 19.99,
		level: 'basic',
		students: 48_120,
	},
	{
		id: 'nest-02',
		title: 'NestJS: API REST modular',
		hours: 31,
		priceUSD: 24.99,
		level: 'intermediate',
		students: 22_450,
	},
	{
		id: 'flu-03',
		title: 'Flutter: apps multiplataforma',
		hours: 46,
		priceUSD: 29.99,
		level: 'intermediate',
		students: 61_300,
	},
	{
		id: 'agt-04',
		title: 'Agentes de IA con TypeScript',
		hours: 18,
		priceUSD: 34.99,
		level: 'advanced',
		students: 1_890,
	},
	{
		id: 'dkr-05',
		title: 'Docker para desarrolladores',
		hours: 14,
		priceUSD: 17.99,
		level: 'basic',
		students: 35_770,
	},
];

const QUESTION =
	'¿Cuanto costarian juntos el curso de Typescript y el de Docker' +
	'con un 20% de descuento? Dame tambien las horas totales';

async function withoutTools() {
	const tracer = createTracer('withoutTools');
	const { text } = await generateText({
		model,
		prompt: QUESTION,
		onStepEnd: tracer.onStepFinish,
	});

	console.log('\n Respuesta: ', text.green);
	console.log('\n Verificar los numeros contra el catalogo de cursos');

	return tracer.summary();
}

//! Implementar el Patron TOOL USE

// Tool #1 find courses
const findCourse = tool({
	description:
		'Buscar cursos en el catalogo de DevTalles, por texto ' +
		'por titulo o por nivel. Utilizala siempre antes de responder ' +
		'cualquier pregunta sobre cursos, precios, duracion, cantidad de alumnos. ',
	inputSchema: z.object({
		text: z
			.string()
			.optional()
			.describe('Texto a buscar en el titulo del curso'),
		level: z
			.enum(['basic', 'intermediate', 'advanced'])
			.optional()
			.describe('Nivel del curso'),
	}),
	execute: async ({ text, level }) => {
		const filteredCourses = COURSE_CATALOG.filter((course) => {
			const matchesText =
				!text || course.title.toLowerCase().includes(text.toLowerCase());
			const matchesLevel = !level || course.level === level;
			return matchesText && matchesLevel;
		});

		return {
			found: filteredCourses.length,
			courses: filteredCourses,
		};
	},
});

// Tool #2 calculate total price
const calculateTotal = tool({
	description:
		'Calcula el precio total de un conjunto de cursos aplicando un descuento porcentual. ' +
		'Utilizala siempre para cualquier operacion aritmetica: no calcules mentalmente, ni inventes precios.',
	execute: async ({ ids, discountPercent }) => {
		const foundCourses = COURSE_CATALOG.filter((course) =>
			ids.includes(course.id),
		);

		const notFound = ids.filter(
			(id) => !COURSE_CATALOG.some((course) => course.id === id),
		);

		const subtotal = foundCourses.reduce(
			(sum, course) => sum + course.priceUSD,
			0,
		);

		const discount = (subtotal * discountPercent) / 100;

		return {
			subtotal: Number(subtotal.toFixed(2)),
			discount: Number(discount.toFixed(2)),
			total: Number((subtotal - discount).toFixed(2)),
			notFound,
		};
	},
	inputSchema: z.object({
		ids: z.any().array().describe('IDs de los cursos. ej: ["ts-01", "dkr-05"]'),
		discountPercent: z
			.number()
			.describe('Descuento a aplicar, en porcentaje. ej: 20')
			.min(0)
			.max(100),
	}),
});

async function withTools() {
	const tracer = createTracer('withTools');
	const { text } = await generateText({
		model,
		prompt: QUESTION,
		tools: { findCourse, calculateTotal },
		stopWhen: stepCountIs(6),
		instructions:
			'Antes de responder, busca los cursos en el catalogo usando la herramienta findCourse. ' +
			'No inventes precios, duracion ni nombres de cursos. ' +
			'Si no puedes encontrar los cursos, responde que no puedes responder la pregunta.',
		onStepEnd: tracer.onStepFinish,
	});

	console.log('\n Respuesta: ', text.green);
	console.log('\n Verificar los numeros contra el catalogo de cursos');

	return tracer.summary();
}

export async function useToolMain() {
	// const resultA = await withoutTools();
	const resultB = await withTools();

	console.log('\n=== Comparativa ===');
	console.table({
		// 'Sin herramientas: ': resultA,
		'Con herramientas: ': resultB,
	});
}
