import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import { authService } from "@/services/api";

interface User {
  id: string;
  name: string;
  email: string;
  roleId: number;
  teamId: number;
  positionId: number;
  role: Role;
  Team?: Team;
  position?: Position;
  leadId? : User;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

// Login Thunk
export const loginUser = createAsyncThunk(
  "auth/login",
  async (
    { email, password }: { email: string; password: string },
    thunkAPI
  ) => {
    const { token, user } = await authService.login(email, password);
    const tokenParts = token.split(".");
    const payload = JSON.parse(atob(tokenParts[1]));
    localStorage.setItem("authToken", token);
    localStorage.setItem("authUser", JSON.stringify(payload));
    return { token, user };
  }
);

// Signup Thunk
export const signupUser = createAsyncThunk(
  "auth/signup",
  async (
    { email, password }: { email: string; password: string },
    thunkAPI
  ) => {
    await authService.signup(email, password);
  }
);


const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
    },
    loadStoredAuth(state) {
      const token = localStorage.getItem("authToken");
      const userStr = localStorage.getItem("authUser");

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          state.token = token;
          state.user = user;
          state.isAuthenticated = true;
        } catch (error) {
          // If there's an error parsing the user, clear the auth state
          localStorage.removeItem("authToken");
          localStorage.removeItem("authUser");
        }
      }
      state.isLoading = false;
    },
    /////////////////////////////////////
    setAuthData(state, action: PayloadAction<{ token: string; user: User }>) {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      localStorage.setItem("authToken", token);
      localStorage.setItem("authUser", JSON.stringify(user));
      state.isAuthenticated = true;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoading = false;
    });
    builder.addCase(signupUser.fulfilled, (state) => {
      // Optional handling
    });
    builder.addCase(loginUser.rejected, (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.isLoading = false;
    });
  },
});

export const { logout, loadStoredAuth, setAuthData } = authSlice.actions;
export default authSlice.reducer;
