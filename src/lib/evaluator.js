// todo: make this more performant?
const mathFunctions = {
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
};
const mathFunctionsJS = Object.entries(mathFunctions)
	.map(([name, fn]) => `const ${name} = ${fn};`)
	.join('');

export function evaluateLines(lines) {
	const results = [];
	const variables = {}; // Store variables
	let lastResult = undefined; // To keep track of the last result

	for (let line of lines) {
		line = line.split('//')[0];
		if (!line) {
			results.push({ type: 'null', value: undefined });
			continue;
		}
		try {
			let expression = line.trim();

			variables.last = lastResult;

			// Replace "^" with "**" for exponentiation
			expression = expression.replace(/\^/g, '**');

			if (/^[$_\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Nl}][$_\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Nl}\u200C\u200D\p{Mn}\p{Mc}\p{Nd}\p{Pc}]*\s*=(?![=>])/u.test(expression)) {
				// todo: add support for "f(x)=x" to "f=(x)=>x" transformation
				const [varName, varExpression] = expression.split(/=(.+)/);
				const trimmedName = varName.trim();
				if (!varExpression) {
					results.push({ type: 'error', value: `Error: Invalid assignment` });
					continue;
				}

				// Evaluate the right-hand side of the assignment without variable replacement
				const result = evaluateExpression(varExpression.trim(), variables);
				variables[trimmedName] = result;
				lastResult = result;
				results.push({ type: 'result', value: result });
			} else {
				// Evaluate as a standalone expression
				const result = evaluateExpression(expression, variables);
				lastResult = result;
				results.push({ type: 'result', value: result });
			}
		} catch (error) {
			results.push({ type: 'error', value: `Error: ${error.message}` });
		}
	}
	return results;
}

function evaluateExpression(expression, variables) {
	// there is no way to prevent full global access from here
	// https://d0nut.medium.com/why-building-a-sandbox-in-pure-javascript-is-a-fools-errand-d425b77b2899
	// todo: automatic multiplication insertion?
	return Function(
		...Object.keys(variables),
		`'use strict';
const window = undefined; const globalThis = undefined; const document = undefined; const fetch = undefined;
${mathFunctionsJS}
return ${expression};`
	)(...Object.values(variables));
}
