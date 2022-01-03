import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { prisma } from "@utils/prisma";
import { OrganizationPlanType, OrganizationType, Role } from "@prisma/client";

async function createPersonalOrganization(userId: string) {
  let hobbyPlan = await prisma.organizationPlan.findUnique({
    where: {
      planType_active: {
        planType: OrganizationPlanType.HOBBY,
        active: true,
      },
    },
  });

  if (!hobbyPlan) {
    hobbyPlan = await prisma.organizationPlan.create({
      data: {
        name: "Hobby",
        planType: OrganizationPlanType.HOBBY,
      },
    });
  }

  const organization = await prisma.organization.create({
    data: {
      type: OrganizationType.PERSONAL,
      organizationPlanId: hobbyPlan.name,
    },
  });

  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      organizations: {
        create: {
          isPersonal: true,
          role: Role.ADMIN,
          organizationId: organization.id,
        },
      },
    },
  });
}

export default NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt",
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },

  callbacks: {
    async jwt({ token, user }) {
      user && ((token as any).userId = user.id);
      return token;
    },

    async session({ session, token }) {
      return {
        ...session,
        userId: token?.userId,
      };
    },
  },

  events: {
    signIn: async ({ user: { id } }) => {
      const user = await prisma.user.findUnique({
        where: {
          id,
        },
        select: {
          organizations: {
            where: {
              isPersonal: true,
            },
          },
        },
      });

      if (!user?.organizations || !user?.organizations?.length) {
        await createPersonalOrganization(id);
      }
    },

    createUser: async ({ user }) => {
      // create personal org
      await createPersonalOrganization(user.id);
    },
  },

  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],

  pages: {
    signIn: "/auth/signin",
    // signOut: "/auth/signout",
    // error: "/auth/error", // Error code passed in query string as ?error=
    // verifyRequest: "/auth/verify-request", // (used for check email message)
    // newUser: "/auth/new-user",
  },
});
