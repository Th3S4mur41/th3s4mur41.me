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
		worksFor: {
			"@type": "Organization",
			name: "cycos AG",
		},
		sameAs: [
			"https://www.linkedin.com/in/michaelvanderheyden/",
			"https://bsky.app/profile/th3s4mur41.me",
			"https://github.com/Th3S4mur41",
			"https://codepen.io/th3s4mur41/",
			"https://th3s4mur41.medium.com/",
			"https://www.instagram.com/th3s4mur41/",
			"https://twitter.com/Th3S4mur41",
			"https://fosstodon.org/@Th3S4mur41",
			"https://www.fronta11y.org/author/mvanderheyden/",
			"https://dev.to/th3s4mur41",
			"https://atos.net/de/expert/michael-vanderheyden",
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
