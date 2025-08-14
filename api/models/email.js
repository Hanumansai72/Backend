import http from 'k6/http';
import { sleep } from 'k6';

export let options = {
  vus: 100, // 100 users
  duration: '30s', // for 30 seconds
};

export default function () {
  http.get('https://apnamestri.com');
  sleep(1);
}
