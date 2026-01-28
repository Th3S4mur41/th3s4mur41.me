import profileImage from "/src/assets/michael-profile-2022-katana.png";

export const getPersonData = (origin: string) => {
	const imageUrl = new URL(profileImage.src, origin).href;

	return {
		"@type": "Person" as const,
		"@id": "https://th3s4mur41.me/#person",
		name: "Michaël Vanderheyden",
		alternateName: "Th3S4mur41",
		url: "https://th3s4mur41.me/",
		image: imageUrl,
		sameAs: [
			"https://www.linkedin.com/in/michaelvanderheyden/",
			"https://bsky.app/profile/th3s4mur41.me",
			"https://github.com/Th3S4mur41",
			"https://codepen.io/th3s4mur41/",
			"https://th3s4mur41.medium.com/",
			"https://www.instagram.com/th3s4mur41/",
			"https://twitter.com/Th3S4mur41",
			"https://fosstodon.org/@Th3S4mur41",
		],
	};
};

export const getWebsiteData = () => ({
	"@type": "WebSite" as const,
	"@id": "https://th3s4mur41.me/#website",
	url: "https://th3s4mur41.me/",
	name: "Th3S4mur41",
	description:
		"Personal website and blog of Michaël Vanderheyden - Web developer passionate about accessibility, modern web standards, and user-friendly interfaces",
	image: "https://th3s4mur41.me/icons/favicon-512.png",
	publisher: {
		"@id": "https://th3s4mur41.me/#person",
	},
});
