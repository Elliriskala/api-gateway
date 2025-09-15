import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import {createProxyMiddleware} from 'http-proxy-middleware';
import {ClientRequest} from 'http';

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.disable('x-powered-by');

const services = [
  {
    route: '/kissat3',
    target: 'http://meowfacts.herokuapp.com/',
  },
  {
    route: '/dragonball',
    target: 'http://dragonball-api.com/api/characters/4',
  },
  {
    route: '/weather',
    target: 'http://api.openweathermap.org/data/2.5/weather',
    on: {
      proxyReq: (proxyReq: ClientRequest) => {
        // Append API key
        const url = new URL(proxyReq.path!, 'https://api.openweathermap.org');
        url.searchParams.append('appid', process.env.WEATHER_API_KEY || '');
        proxyReq.path = url.pathname + url.search;
      },
    },
  },
];

services.forEach(({route, target, on}) => {
  const proxyOptions = {
    on,
    target,
    changeOrigin: true,
    pathRewrite: {
      [`^${route}`]: '',
    },
    secure: process.env.NODE_ENV === 'production', // Enable SSL verification in production
  };

  console.log(proxyOptions);
  app.use(route, createProxyMiddleware(proxyOptions));
});

export default app;
