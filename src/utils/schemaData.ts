import profileImage from "/src/assets/michael-vanderheyden-profile-colors.jpg";

export const getPersonData = (origin: string) => {
	const imageUrl = new URL(profileImage.src, origin).href;

	return {
		"@type": "Person" as const,
		"@id": `${origin}/#person`,
		name: "Michaël Vanderheyden",
		alternateName: "Th3S4mur41",
		url: "https://th3s4mur41.me/",
		image: imageUrl,
		description: "Lead UX Engineer & Accessibility Specialist",
		jobTitle: "Lead UX Engineer",
		worksFor: [
			{
				"@type": "Organization",
				name: "cycos AG",
				url: "https://www.cycos.com",
			},
			{
				"@type": "Organization",
				name: "Atos",
				url: "https://atos.net",
			},
		],
		knowsLanguage: ["fr", "de", "en"],
		knowsAbout: [
			{
				"@type": "Thing",
				name: "Web Accessibility",
				sameAs: "https://www.w3.org/WAI/fundamentals/accessibility-intro/",
			},
			{
				"@type": "Thing",
				name: "UX Engineering",
			},
			{
				"@type": "Thing",
				name: "Modern Web Standards",
				sameAs: "https://www.w3.org/standards/",
			},
			{
				"@type": "Thing",
				name: "HTML",
				sameAs: "https://developer.mozilla.org/en-US/docs/Web/HTML",
			},
			{
				"@type": "Thing",
				name: "CSS",
				sameAs: "https://developer.mozilla.org/en-US/docs/Web/CSS",
			},
			{
				"@type": "Thing",
				name: "WCAG 2.2",
				sameAs: "https://www.w3.org/TR/WCAG22/",
			},
			{
				"@type": "Thing",
				name: "Software Engineering",
				sameAs: "https://en.wikipedia.org/wiki/Software_engineering",
			},
		],
		alumniOf: {
			"@type": "EducationalOrganization",
			name: "HEPL - Haute Ecole de la Province de Liège (Seraing)",
			url: "https://www.hepl.be/",
		},
		hasCredential: [
			{
				"@type": "EducationalOccupationalCredential",
				name: "Bachelor of Computer Science",
				credentialCategory: "Degree",
				recognizedBy: { "@type": "Organization", name: "HEPL - Haute Ecole de la Province de Liège (Seraing)" },
			},
			{
				"@type": "EducationalOccupationalCredential",
				name: "Certified Professional in Web Accessibility (CPWA)",
				credentialCategory: "Certification",
				recognizedBy: { "@type": "Organization", name: "IAAP" },
				url: "https://www.credly.com/badges/3779ebb4-05ca-4512-9fe3-4be51ee8e3df/public_url",
			},
			{
				"@type": "EducationalOccupationalCredential",
				name: "IAAP DACH KB-BFL Badge",
				credentialCategory: "Badge",
				recognizedBy: { "@type": "Organization", name: "IAAP DACH" },
				url: "https://www.credly.com/badges/450df9d3-497d-43dc-a9a5-ad106538ff64/public_url",
			},
			{
				"@type": "EducationalOccupationalCredential",
				name: "GitHub Copilot Certified",
				credentialCategory: "Certification",
				recognizedBy: { "@type": "Organization", name: "GitHub" },
				url: "https://www.credly.com/badges/768a3f7e-d99c-446c-90f9-b6f726222349/public_url",
			},
			{
				"@type": "EducationalOccupationalCredential",
				name: "GitHub Actions Certified",
				credentialCategory: "Certification",
				recognizedBy: { "@type": "Organization", name: "GitHub" },
				url: "https://www.credly.com/badges/ac887f1d-5b7b-4ede-a4f1-c71206a570ac/public_url",
			},
			{
				"@type": "EducationalOccupationalCredential",
				name: "Atos: Leading in the Digital Age (LIDA)",
				credentialCategory: "Professional Certificate",
				recognizedBy: { "@type": "Organization", name: "Harvard Business Publishing" },
				url: "https://www.credly.com/badges/9d51f898-a6cf-4a58-8ac5-e9e9d3cfd85c/public_url",
			},
		],
		sameAs: [
			"https://www.linkedin.com/in/michaelvanderheyden/",
			"https://bsky.app/profile/th3s4mur41.me",
			"https://keytrace.dev/@th3s4mur41.me",
			"https://github.com/Th3S4mur41",
			"https://codepen.io/th3s4mur41/",
			"https://th3s4mur41.medium.com/",
			"https://www.instagram.com/th3s4mur41/",
			"https://twitter.com/Th3S4mur41",
			"https://fosstodon.org/@Th3S4mur41",
			"https://www.youtube.com/@Th3S4mur41",
			"https://www.fronta11y.org/author/mvanderheyden/",
			"https://dev.to/th3s4mur41",
			"https://atos.net/de/expert/michael-vanderheyden",
			"https://stackoverflow.com/users/7041074/th3s4mur41",
			"https://www.w3.org/users/127883/",
			"https://www.reddit.com/user/Th3S4mur41/",
			"https://community.ui.com/user/9228b10a-4e46-476e-917f-a538490ceae8",
			"https://www.npmjs.com/~th3s4mur41",
			"https://npmx.dev/org/th3s4mur41",
			"https://techcommunity.microsoft.com/users/th3s4mur41/111608",
		],
	};
};

export const getWebsiteData = (origin: string) => ({
	"@type": "WebSite" as const,
	"@id": `${origin}/#website`,
	url: origin,
	name: "Th3S4mur41",
	description:
		"Personal website and blog of Michaël Vanderheyden - Web developer passionate about accessibility, modern web standards, and user-friendly interfaces",
	image: `${origin}/icons/favicon-512.png`,
});
