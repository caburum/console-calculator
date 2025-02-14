// todo: make this more performant?

export function evaluateLines(lines) {
	const results = [];
	const variables = {};
	let lastResult = undefined;

	for (let line of lines) {
		line = line.split('//')[0];
		if (!line) {
			results.push({ type: 'null', value: undefined });
			continue;
		}
		try {
			let expression = line.trim();

			variables.last = lastResult;
			variables.ans = lastResult;

			// Replace "^" with "**" for exponentiation
			expression = expression.replace(/\^/g, '**');

			const scientific = expression.endsWith('#');
			if (scientific) expression = expression.slice(0, -1);

			const variableNameRegex = '[$_\\p{Lu}\\p{Ll}\\p{Lt}\\p{Lm}\\p{Lo}\\p{Nl}][$_\\p{Lu}\\p{Ll}\\p{Lt}\\p{Lm}\\p{Lo}\\p{Nl}\u200C\u200D\\p{Mn}\\p{Mc}\\p{Nd}\\p{Pc}]*';
			const match = new RegExp(`^(${variableNameRegex})(?:\\s*\\((\\s*(?:[\\w\\s=,])*)\\))?\\s*=(?![=>])`, 'u').exec(expression);

			if (match) {
				let varName = match[1],
					varExpression = expression.substring(match[0].length)?.trim();

				if (!varExpression) {
					results.push({ type: 'error', value: `Error: Invalid assignment` });
					continue;
				}

				if (match?.[2]) varExpression = `(${match[2].trim()}) => ${varExpression}`;

				// Evaluate the right-hand side of the assignment without variable replacement
				const result = evaluateExpression(varExpression.trim(), variables);
				variables[varName] = result;
				lastResult = result;
				results.push({ type: 'result', value: result, scientific });
			} else {
				// Evaluate as a standalone expression
				const result = evaluateExpression(expression, variables);
				lastResult = result;
				results.push({ type: 'result', value: result, scientific });
			}
		} catch (error) {
			results.push({ type: 'error', value: `Error: ${error.message}` });
		}
	}
	return results;
}

const convertSIPrefix = ((input, toPrefix = '') => {
	const prefixes = {
		E: 18,
		P: 15,
		T: 12,
		G: 9,
		M: 6,
		k: 3,
		h: 2,
		da: 1,
		'': 0,
		d: -1,
		c: -2,
		m: -3,
		μ: -6,
		u: -6,
		n: -9,
		p: -12,
		f: -15,
		a: -18,
	};

	const [_, value, fromPrefix] = /(.*?)\s*(\D*?)\s*$/u.exec(input.toString());

	if (!(fromPrefix in prefixes) || !(toPrefix in prefixes)) throw new Error('Invalid SI prefix');

	// return Number(value) * (prefixes[fromPrefix] / prefixes[toPrefix]);
	return Number(value) * 10 ** (prefixes[fromPrefix] - prefixes[toPrefix]);
}).bind(undefined);
Object.defineProperty(convertSIPrefix, 'toString', {
	value: () => `convertSIPrefix(input, toPrefix = '')`,
});

const globals = {
	abs: (x) => Math.abs(x),
	sin: (rad) => Math.sin(rad),
	cos: (rad) => Math.cos(rad),
	tan: (rad) => Math.tan(rad),
	asin: (x) => Math.asin(x),
	arcsin: (x) => Math.asin(x),
	acos: (x) => Math.acos(x),
	arccos: (x) => Math.acos(x),
	atan: (x) => Math.atan(x),
	arctan: (x) => Math.atan(x),
	log: (x) => Math.log10(x),
	ln: (x) => Math.log(x),
	sqrt: (x) => Math.sqrt(x),
	exp: (x) => Math.exp(x),
	hypot: (a, b) => Math.hypot(a, b),
	rad: (deg) => (deg * Math.PI) / 180,
	deg: (rad) => (rad * 180) / Math.PI,
	pi: Math.PI,
	e: Math.E,
	c: convertSIPrefix,
};

function evaluateExpression(expression, variables) {
	// there is no way to prevent full global access from here
	// https://d0nut.medium.com/why-building-a-sandbox-in-pure-javascript-is-a-fools-errand-d425b77b2899
	// todo: automatic multiplication insertion?
	return Function(
		...Object.keys(globals),
		...Object.keys(variables),
		`'use strict';
const window = undefined; const globalThis = undefined; const document = undefined; const fetch = undefined;
return ${expression};`
	)(...Object.values(globals), ...Object.values(variables));
}
