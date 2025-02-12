<script>
	import { onMount } from 'svelte';
	import { evaluateLines } from './lib/evaluator';
	import { downloadAsFile, loadFileAsText } from './lib/helpers';

	let consoleView;
	let sizeTest;
	let results = [];

	const resultClasses = {
		null: 'normal',
		result: 'normal',
		error: 'error',
	};

	let dlStr = '';

	function processConsole() {
		localStorage.setItem('window_snapshot', consoleView.innerHTML);
		let lines_unfiltered = consoleView.innerText.split('\n');
		let lines = [];
		let lastLine = true;
		lines_unfiltered.forEach((line) => {
			if (!line && !lastLine) {
				lastLine = true;
				return;
			} else {
				lastLine = line;
				lines.push(line);
			}
		});
		dlStr = lines.join('\n');
		let resultValues = evaluateLines(lines);
		let ypos = 0;
		let setTitle = null;
		results = lines.map((line, ind) => {
			sizeTest.innerText = line + '-';
			let rect = sizeTest.getBoundingClientRect();
			let x = rect.width;
			let y = ypos;
			ypos += rect.height;
			let content = resultValues[ind];
			if (content.type === 'result') {
				if (typeof content.value === 'object' || typeof content.value === 'string') {
					content.value = JSON.stringify(content.value);
				}
				setTitle = content.value;
			}
			return { line, x, y, content };
		});

		document.title = setTitle || 'console calculator';
	}

	onMount(() => {
		console.log('%ccc', 'background-color: #8FF; color: black; padding: 8px; border-radius: 6px; font-family: monospace; font-weight: 900;');
		let preload = localStorage.getItem('window_snapshot');
		if (preload) consoleView.innerHTML = preload;
		processConsole();
		setTimeout(processConsole, 100);
	});
</script>

<svelte:window onresize={processConsole} />

<main>
	<div class="topBar" style="--text: #8FF; --fg: #8FF2">
		cc
		<button
			on:click={() => {
				consoleView.innerHTML = '';
				processConsole();
			}}>clear</button
		>
		<button
			on:click={() => {
				downloadAsFile(
					dlStr,
					'cc-' +
						new Date()
							.toLocaleString('en-GB', {
								day: '2-digit',
								month: 'long',
								year: '2-digit',
								hour: '2-digit',
								minute: '2-digit',
								hour12: false,
							})
							.replace(/,|\s|:/g, '-')
				);
			}}>save</button
		>
		<button
			on:click={() => {
				if (confirm('Warning: Current content will be cleared, and new content will be evaluated. Only load files you trust.'))
					loadFileAsText().then((text) => {
						consoleView.innerText = text;
						processConsole();
					});
			}}>load</button
		>
		<button
			on:click={() => {
				print();
			}}>print</button
		>
	</div>
	<div class="consoleArea">
		<div class="sizeTest" bind:this={sizeTest}>hello</div>
		<!-- svelte-ignore a11y_autofocus -->
		<div
			bind:this={consoleView}
			on:input={processConsole}
			on:paste={(event) => {
				event.preventDefault();

				// @ts-expect-error
				const clipboardData = event.clipboardData || window.clipboardData;
				const pastedText = clipboardData.getData('text/plain');

				document.execCommand('insertText', false, pastedText);
			}}
			contenteditable
			spellcheck="false"
			class="consoleEditor"
			autofocus
			style="display: inline;"
		></div>
		{#each results as result}
			<div style:top={result.y + 'px'} class={'resultBlock ' + resultClasses[result.content.type]} style:left={result.x + 'px'}>
				{result.content.type === 'result' ? '= ' : ''}
				{result.content.value}
			</div>
		{/each}
	</div>
</main>

<style lang="scss">
	main {
		padding: 16px;
		height: 100vh;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 16px;
		@media print {
			padding: 0;
		}
	}
	.topBar {
		display: flex;
		align-items: center;
		gap: 8px;
		@media print {
			display: none;
		}
	}
	.consoleArea {
		flex: 1;
		overflow: auto;
		position: relative;
		line-height: 1.5em;
	}
	.sizeTest {
		display: inline;
		position: absolute;
		visibility: hidden;
	}
	.resultBlock {
		position: absolute;
		white-space: nowrap;
		&.normal {
			color: var(--green);
		}
		&.error {
			color: var(--red);
		}
	}
	.consoleEditor {
		box-sizing: border-box;
		position: absolute;
		min-height: 100%;
		min-width: 100%;
		> :global(*::after) {
			content: attr(result-value);
			color: green;
		}
		&:focus {
			outline: none;
		}
	}
</style>
