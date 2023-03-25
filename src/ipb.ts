// eslint-disable-next-line no-shadow
export enum Visibility {
	Visible = 0,
	HiddenPendingApproval = 1,
	HiddenByModerator = -1
}

export type Member = {
	id: number;
	name: string;
};

export type Post = {
	id: number;
	item_id: number;
	date: string;
	author: Member;
	content: string;
	hidden: boolean;
	url: string;
};

export type Topic = {
	id: number;
	title: string;
	posts: number;
	views: number;
	tags: string[];
	prefix: string;
	locked: boolean;
	hidden: Visibility;
	pinned: boolean;
	featured: boolean;
	url: string;
	firstPost: Post;
};

export type PagedResponse<TValue> = {
	page: number;
	perPage: number;
	totalResults: number;
	totalPages: number;
	results: TValue[];
};
