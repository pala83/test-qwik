import { QwikAuth$ } from "@auth/qwik";
import Google from "@auth/qwik/providers/google";

export const { onRequest, useSession, useSignIn, useSignOut } = QwikAuth$(
  ({ env }) => ({
    secret: env.get("AUTH_SECRET"),
    trustHost: true,
    providers: [
      Google({
        clientId: env.get("GOOGLE_CLIENT_ID"),
        clientSecret: env.get("GOOGLE_CLIENT_SECRET"),
        authorization: {
          params: {
            scope:
              "openid email profile https://www.googleapis.com/auth/calendar.events",
            prompt: "consent",
            access_type: "offline",
            response_type: "code",
          },
        },
      }),
    ],
    callbacks: {
      async jwt({ token, account, profile }) {
        if (account) {
          console.log("--- GOOGLE AUTH DEBUG: ACCOUNT (Tokens & Permisos) ---");
          console.log(JSON.stringify(account, null, 2));
          console.log("--- GOOGLE AUTH DEBUG: PROFILE (Datos Usuario) ---");
          console.log(JSON.stringify(profile, null, 2));

          token.accessToken = account.access_token;
        }
        return token;
      },
      async session({ session, token }) {
        (session as any).accessToken = token.accessToken;
        return session;
      },
    },
  }),
);
