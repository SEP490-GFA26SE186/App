// apps/mobile/src/types/api.ts
// DTO response của BE (rev8) mà Mobile đang dùng. Nguồn: docs/mobile/API_MAPPING.md đối chiếu BE/api/src/modules/*.
// Chỉ liệt kê trường BE thực sự trả; không thêm trường để hợp với UI. packages/shared-types là READ-ONLY nên DTO nằm ở Mobile.
// Mapper BE → UI vẫn nhận `any` ở các hàm formatXxx (còn đọc trường legacy) – sẽ siết ở T4.1/T4.2.

export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---- Auth ----
export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthUserDto {
  id: string;
  role: string;
  username: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  hasKidPin: boolean;
  emailVerifiedAt?: string | null;
  createdAt: string;
  /** Chỉ có ở GET /auth/me (login/register không trả ví) */
  wallet?: { creditBalance: number; earningAvailableVnd?: number };
}

/** POST /auth/login, POST /auth/register */
export interface LoginResponseDto {
  user: AuthUserDto;
  tokens: AuthTokensDto;
}

/** GET /auth/me */
export interface MeResponseDto {
  user: AuthUserDto;
}

/** POST /auth/kid-mode/enter */
export interface EnterKidModeResponseDto {
  child: { id: string; name: string; birthDate?: string | null; preferredVoice?: string | null };
  session: { kidSessionToken: string; expiresIn: string };
}

/** POST /auth/kid-mode/exit */
export interface ExitKidModeResponseDto {
  tokens: AuthTokensDto;
}

// ---- Characters / Children ----
export interface CharacterDto {
  id: string;
  name: string;
  appearance: string;
  portraitImageKey?: string | null;
  portraitImageUrl?: string | null;
  portraitStatus?: string | null;
  portraitFailure?: string | null;
}

export interface ChildDto {
  id: string;
  name: string;
  birthDate?: string | null;
  age?: number;
  preferredVoice?: string | null;
  character?: CharacterDto | null;
  booksCount?: number;
  completedSessionsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** GET /children, POST/PUT /children */
export interface ChildrenListDto {
  children: ChildDto[];
}
export interface ChildResponseDto {
  child: ChildDto;
}

/** GET /characters, POST/PUT /characters */
export interface CharactersListDto {
  characters: CharacterDto[];
}
export interface CharacterResponseDto {
  character: CharacterDto;
}

// ---- Stories / Topics ----
export interface StoryPageDto {
  id: string;
  pageOrder: number;
  contentText?: string | null;
  audioUrl?: string | null;
  audioStatus?: string | null;
}

export interface StoryDto {
  id: string;
  title: string;
  status?: string;
  cover?: { imageUrl?: string | null } | null;
  readiness?: { ready: boolean; reason?: string | null };
  pages?: StoryPageDto[];
}

/** GET /stories/:id, POST /stories */
export interface StoryResponseDto {
  story: StoryDto;
}

/** GET /topics (phía phụ huynh) */
export interface TopicDto {
  id: string;
  title: string;
  guidance?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  skill?: { nameVi?: string | null } | null;
}
