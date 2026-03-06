// import { DefaultSession } from "next-auth"

// declare module "next-auth" {
//   interface Session {
//     user: {
//       id: string
//     } & DefaultSession["user"]
//   }
// }


import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string | null
    } & DefaultSession["user"]
  }

  interface User {
    role?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    profileId?: string
    role?: string | null
  }
}