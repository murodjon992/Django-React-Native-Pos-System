import axios from "axios";

const API = axios.create({
  baseURL: "http://192.168.100.118:8000/api/"
});

export default API;