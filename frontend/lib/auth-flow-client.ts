import axios from "axios";
import apiClient from "./api-client";

// These public recovery/callback flows own their error UI. The workspace client's
// cached-token injection and global 401 redirect must not interrupt them.
const authFlowClient = axios.create({
  baseURL: apiClient.defaults.baseURL,
  headers: { "Content-Type": "application/json" },
});

export default authFlowClient;
