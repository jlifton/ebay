import * as Express from 'express';

import { topicGet } from 'routes/topic';

export const initRoutes = (app: Express.Application) => {
	app.get('/topics', topicGet);
};
