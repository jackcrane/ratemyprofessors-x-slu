if (!window.location.href.includes('https://courses.slu.edu')) {
	alert('This bookmarklet only works on courses.slu.edu');
} else {
	alert('Courses@SLU x RMP Bookmarklet loaded');
	const instructorPositions = [];
	const instructorCache = {};

	setInterval(() => {
		document.querySelectorAll('.result__link--viewing').forEach((e) => (e.style.pointerEvents = 'initial'));
	}, 100);

	const getProfessorRatings = async (professorName) => {
		if (professorName === 'TBA' || professorName === 'Staff' || professorName === 'Instructor TBA' || professorName === 'Team') {
			return [false];
		}

		if (instructorCache[professorName]) {
			console.log('Using cache');
			if (instructorCache[professorName][0] === false) {
				return [false, instructorCache[professorName][1]];
			}
			return [true, instructorCache[professorName][1]];
		} else {
			console.log('Not using cache', professorName, instructorCache);
		}

		try {
			const response = await fetch(`https://rmp-conn.jackcrane.workers.dev/api?name=${professorName}`);
			if (!response.ok) {
				const responseText = await response.text();
				instructorCache[professorName] = [false, responseText];
				return [false, await response.text()];
			}
			const responseJson = await response.json();
			instructorCache[professorName] = [true, responseJson];
			return [true, responseJson];
		} catch (error) {
			return [false, error];
		}
	};

	let processProfessorsLastCalled = null;
	const processProfessors = async () => {
		if (processProfessorsLastCalled && Date.now() - processProfessorsLastCalled < 100) {
			console.log('Skipping processing professors');
			return;
		}
		processProfessorsLastCalled = Date.now();

		document.querySelectorAll('.__rmp-rating').forEach((element) => {
			element.remove();
		});

		console.log('Processing professors');

		const srs = document.querySelectorAll('.sr-only');
		if (srs.length > 150) {
			console.log('Too many sr-only elements, skipping processing', srs.length);
			return;
		}

		const instructorHeaders = document.querySelectorAll('.sr-only, .header-text');

		instructorHeaders.forEach((element) => {
			if (element.textContent.trim() === 'Instructor:') {
				const profName = element?.nextSibling?.textContent?.trim();
				if (profName) {
					const ratingPromise = getProfessorRatings(profName).then(([success, data]) => {
						if (success) {
							const rating = data?.avgRating;

							const parentElement = element.parentElement;
							const isInTable = parentElement.getAttribute('role') === 'gridcell';

							const rmpLink = document.createElement('a');
							rmpLink.href = data.link;
							rmpLink.textContent = 'RMP';
							rmpLink.target = '_blank';
							rmpLink.addEventListener('click', (e) => {
								e.stopPropagation();
							});

							const graphsContainer = document.createElement('div');
							graphsContainer.style.display = 'flex';
							graphsContainer.style.gap = '1px'; // Spacing between boxes
							graphsContainer.style.flexDirection = 'column';
							graphsContainer.classList.add('__rmp-rating-graphs');

							// Create a container for the rating boxes
							const ratingContainer = document.createElement('div');
							ratingContainer.style.display = 'flex';
							ratingContainer.style.gap = '1px'; // Spacing between boxes
							ratingContainer.classList.add('__rmp-rating-boxes');

							// Create the 5 rating boxes
							for (let i = 1; i <= 5; i++) {
								const box = document.createElement('div');
								box.style.width = '10px'; // Width of each box
								box.style.height = '5px'; // Height of each box
								box.style.border = '0.5px solid black'; // Box border
								const filledInBgColor = rating > 3 ? '#2fb344' : rating > 2 ? '#f7b731' : '#eb3b5a';
								if (i <= Math.floor(rating)) {
									// Fully filled boxes
									box.style.backgroundColor = filledInBgColor;
								} else if (i === Math.ceil(rating) && rating % 1 !== 0) {
									// Partially filled box for fractional ratings
									box.style.background = `linear-gradient(to right, ${filledInBgColor} ${Math.round(
										(rating % 1) * 100
									)}%, #e6e6e6 ${Math.round((rating % 1) * 100)}%)`;
								} else {
									// Empty boxes
									box.style.backgroundColor = '#e6e6e6';
								}
								ratingContainer.appendChild(box);
							}

							// Create a percentage box for would take again
							const wouldTakeAgainBox = document.createElement('div');
							wouldTakeAgainBox.style.width = '54px'; // Width of the
							wouldTakeAgainBox.style.height = '5px'; // Height of the box
							wouldTakeAgainBox.style.border = '0.5px solid black'; // Box border

							const wouldTakeAgainBgColor =
								data.wouldTakeAgainPercent > 90
									? '#2fb344'
									: data.wouldTakeAgainPercent > 70
									? '#B4B637'
									: data.wouldTakeAgainPercent > 40
									? '#f7b731'
									: '#eb3b5a';
							const wouldTakeAgainFillBox = document.createElement('div');
							wouldTakeAgainFillBox.style.width = `${data.wouldTakeAgainPercent}%`;
							wouldTakeAgainFillBox.style.height = '5px';
							wouldTakeAgainFillBox.style.backgroundColor = wouldTakeAgainBgColor;
							wouldTakeAgainBox.appendChild(wouldTakeAgainFillBox);

							graphsContainer.appendChild(wouldTakeAgainBox);
							graphsContainer.appendChild(ratingContainer);

							const detailLink = document.createElement('a');
							detailLink.href = '#';
							detailLink.addEventListener('click', (e) => {
								e.stopPropagation();
								if (
									confirm(
										`Professor ${data.firstName} ${data.lastName} has the following ratings:

                    Average Rating: ${data.avgRating.toFixed(1)} /5
                    Would Take Again: ${data.wouldTakeAgainPercent.toFixed(0)}%
                    Average Difficulty: ${data.avgDifficulty.toFixed(1)} /5
                    Number of Ratings: ${data.numRatings}

                    Click OK to open the Rate My Professors page for ${profName} in a new tab. Click Cancel to close this dialog.`
											.replace(/[ ]{2,}/g, ' ') // Collapse only spaces, not newlines
											.trim()
									)
								) {
									// Open the RMP page in a new tab
									rmpLink.click();
								}
							});
							detailLink.textContent = '?';

							// Append the boxes and text to the element
							const ratingWrapper = document.createElement('div');
							ratingWrapper.style.display = 'flex';
							ratingWrapper.style.justifyContent = !isInTable ? 'flex-end' : 'left';
							ratingWrapper.style.gap = '5px';
							ratingWrapper.style.alignItems = 'center';
							ratingWrapper.appendChild(rmpLink);
							ratingWrapper.appendChild(graphsContainer);
							ratingWrapper.appendChild(detailLink);
							ratingWrapper.classList.add('__rmp-rating');

							element.parentElement.prepend(ratingWrapper);
						} else {
						}
					});

					instructorPositions.push({
						parent: element.parentElement,
						profName,
						ratingPromise,
					});
				}
			}
		});
	};

	processProfessors();

	const searchButton = document.querySelector('#search-button');
	searchButton.addEventListener('click', () => {
		processProfessors();
	});
	const seachForm = document.querySelector('#search-form');
	seachForm.addEventListener('submit', () => {
		setTimeout(() => {
			processProfessors();
		}, 500);
	});
	document.addEventListener('input', (e) => {
		setTimeout(() => {
			processProfessors();
		}, 500);
	});
	document.addEventListener('change', (e) => {
		setTimeout(() => {
			processProfessors();
		}, 500);
	});

	const observer = new PerformanceObserver((list) => {
		const entries = list.getEntriesByType('resource');
		entries.forEach((entry) => {
			if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
				// Trigger your event here
				if (!entry.name.includes('jackcrane.workers.dev')) {
					setTimeout(() => {
						processProfessors();
					}, 500);
				}
			}
		});
	});

	// Start observing
	observer.observe({ entryTypes: ['resource'] });
}
