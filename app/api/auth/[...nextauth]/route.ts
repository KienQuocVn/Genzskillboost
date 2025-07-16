import NextAuth, { type NextAuthOptions } from "next-auth"
import { SupabaseAdapter } from "@next-auth/supabase-adapter"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import CredentialsProvider from "next-auth/providers/credentials"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string
      username?: string
      role?: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    image?: string
    username?: string
    role?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    username?: string
    role?: string
  }
}

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email và mật khẩu là bắt buộc")
        }

        try {
          const { data: user, error } = await supabase.from("users").select("*").eq("email", credentials.email).single()

          if (error || !user) {
            throw new Error("Email hoặc mật khẩu không đúng")
          }

          // Check if user has a password (for OAuth users)
          if (!user.password_hash) {
            throw new Error("Tài khoản này được tạo bằng mạng xã hội. Vui lòng đăng nhập bằng Google hoặc Facebook.")
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash)

          if (!isPasswordValid) {
            throw new Error("Email hoặc mật khẩu không đúng")
          }

          return {
            id: user.id,
            email: user.email,
            name: user.full_name,
            image: user.avatar_url,
            username: user.username,
            role: user.role || "user",
          }
        } catch (error) {
          console.error("Auth error:", error)
          throw error
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" || account?.provider === "facebook") {
        try {
          // Check if user exists
          const { data: existingUser } = await supabase.from("users").select("id").eq("email", user.email!).single()

          if (!existingUser) {
            // Create new user for OAuth
            const username = user.email!.split("@")[0] + Math.random().toString(36).substr(2, 4)

            const { error } = await supabase.from("users").insert({
              email: user.email!,
              full_name: user.name!,
              username,
              avatar_url: user.image,
              auth_provider: account.provider,
            })

            if (error) {
              console.error("Error creating OAuth user:", error)
              return false
            }
          }
        } catch (error) {
          console.error("OAuth sign in error:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
      }

      // Refresh user data from database
      if (token.email) {
        try {
          const { data: userData } = await supabase
            .from("users")
            .select("id, username, full_name, avatar_url, role")
            .eq("email", token.email)
            .single()

          if (userData) {
            token.id = userData.id
            token.name = userData.full_name
            token.picture = userData.avatar_url
            token.username = userData.username
            token.role = userData.role || "user"
          }
        } catch (error) {
          console.error("Error refreshing user data:", error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.username = token.username
        session.user.role = token.role
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful login
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}/dashboard`
    },
  },
  pages: {
    signIn: "/auth/signin",
    // signUp: "/auth/signup",
    error: "/auth/error",
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      if (isNewUser) {
        // Send welcome notification
        try {
          await supabase.from("notifications").insert({
            user_id: user.id,
            type: "welcome",
            title: "Chào mừng đến với GenZSkillBoost! 🎉",
            message: "Hãy bắt đầu khám phá và chia sẻ những dự án thú vị của bạn!",
            data: { isWelcome: true },
          })
        } catch (error) {
          console.error("Error sending welcome notification:", error)
        }
      }
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
