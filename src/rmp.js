const API_LINK = 'https://www.ratemyprofessors.com/graphql';

const HEADERS = {
	'User-Agent': 'Mozilla/5.0',
	Accept: '*/*',
	'Accept-Language': 'en-US,en;q=0.5',
	'Content-Type': 'application/json',
	Authorization: 'Basic dGVzdDp0ZXN0',
	'Sec-GPC': '1',
	'Sec-Fetch-Dest': 'empty',
	'Sec-Fetch-Mode': 'cors',
	'Sec-Fetch-Site': 'same-origin',
	Priority: 'u=4',
};

const TEACHER_BODY_QUERY = `
query TeacherSearchResultsPageQuery(
  $query: TeacherSearchQuery!
  $schoolID: ID
  $includeSchoolFilter: Boolean!
) {
  search: newSearch {
    ...TeacherSearchPagination_search
  }
  school: node(id: $schoolID) @include(if: $includeSchoolFilter) {
    __typename
    ... on School {
      name
    }
    id
  }
}

fragment TeacherSearchPagination_search on newSearch {
  teachers(query: $query, first: 8, after: "") {
    edges {
      node {
        ...TeacherCard_teacher
        id
        __typename
      }
    }
    resultCount
  }
}

fragment TeacherCard_teacher on Teacher {
  id
  legacyId
  avgRating
  numRatings
  ...CardFeedback_teacher
  ...CardSchool_teacher
  ...CardName_teacher
}

fragment CardFeedback_teacher on Teacher {
  wouldTakeAgainPercent
  avgDifficulty
}

fragment CardSchool_teacher on Teacher {
  department
  school {
    name
    id
  }
}

fragment CardName_teacher on Teacher {
  firstName
  lastName
}
`;

const SCHOOL_BODY_QUERY = `
query NewSearchSchoolsQuery(
  $query: SchoolSearchQuery!
) {
  newSearch {
    schools(query: $query) {
      edges {
        node {
          id
          legacyId
          name
          city
          state
          numRatings
          avgRatingRounded
        }
      }
    }
  }
}
`;

async function searchProfessorsAtSchoolId(professorName, schoolId) {
	try {
		const body = JSON.stringify({
			query: TEACHER_BODY_QUERY,
			variables: {
				query: {
					text: professorName,
					schoolID: schoolId,
					fallback: true,
					departmentID: null,
				},
				schoolID: schoolId,
				includeSchoolFilter: true,
			},
		});

		const response = await fetch(API_LINK, {
			method: 'POST',
			headers: HEADERS,
			body: body,
			// credentials: 'include',
			// mode: 'cors',
		});

		if (!response.ok) {
			throw new Error('Network response from RMP not OK');
		}

		const data = await response.json();
		data.data.search.teachers.edges.map((teacher) => {
			teacher.node.link = `https://www.ratemyprofessors.com/professor/${teacher.node.legacyId}`;
		});
		return data.data.search.teachers.edges;
	} catch (error) {
		console.error(error);
	}
}

async function searchSchool(schoolName) {
	try {
		const body = JSON.stringify({
			query: SCHOOL_BODY_QUERY,
			variables: {
				query: {
					text: schoolName,
				},
			},
		});

		const response = await fetch(API_LINK, {
			method: 'POST',
			headers: HEADERS,
			body: body,
			// credentials: 'include',
			// mode: 'cors',
		});

		if (!response.ok) {
			throw new Error('Network response from RMP not OK');
		}

		const data = await response.json();
		console.log(data);
		return data.data.newSearch.schools.edges;
	} catch (error) {
		console.error(error);
	}
}

async function getProfessorRatingAtSchoolId(professorName, schoolId) {
	const searchResults = await searchProfessorsAtSchoolId(professorName, schoolId);

	if (!searchResults || searchResults.length === 0) {
		return {
			avgRating: -1,
			avgDifficulty: -1,
			wouldTakeAgainPercent: -1,
			numRatings: 0,
			formattedName: professorName,
			department: '',
			link: '',
		};
	}

	const professor = searchResults[0].node;
	return {
		avgRating: professor.avgRating,
		avgDifficulty: professor.avgDifficulty,
		wouldTakeAgainPercent: professor.wouldTakeAgainPercent,
		numRatings: professor.numRatings,
		formattedName: `${professor.firstName} ${professor.lastName}`,
		department: professor.department,
		link: `https://www.ratemyprofessors.com/professor/${professor.legacyId}`,
	};
}

// export { searchProfessorsAtSchoolId, searchSchool, getProfessorRatingAtSchoolId };
export default { searchProfessorsAtSchoolId, searchSchool, getProfessorRatingAtSchoolId };
