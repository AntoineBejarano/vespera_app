/**
 * Hexclave project config (v1 IdP).
 * Product authz is canonical in Prisma WorkspaceMember + capability map.
 * These RBAC definitions mirror product roles for optional Hexclave Teams sync.
 * Defaults: teamCreator → owner, teamMember → viewer (least privilege).
 */
export const config = {
  rbac: {
    permissions: {
      "workspace.read": {
        description: "Read workspace content",
        scope: "team",
        containedPermissionIds: {},
      },
      "personas.read": {
        description: "Read personas",
        scope: "team",
        containedPermissionIds: {},
      },
      "knowledge.read": {
        description: "Read knowledge packs",
        scope: "team",
        containedPermissionIds: {},
      },
      "chat_history.read": {
        description: "Read playground/chat history",
        scope: "team",
        containedPermissionIds: {},
      },
      "personas.write": {
        description: "Create/edit persona drafts",
        scope: "team",
        containedPermissionIds: {},
      },
      "knowledge.write": {
        description: "Create/edit/link knowledge packs",
        scope: "team",
        containedPermissionIds: {},
      },
      "playground.run": {
        description: "Run playground chat",
        scope: "team",
        containedPermissionIds: {},
      },
      "content.publish": {
        description: "Publish personas / fork settings",
        scope: "team",
        containedPermissionIds: {},
      },
      "content.archive": {
        description: "Archive personas and packs",
        scope: "team",
        containedPermissionIds: {},
      },
      "connections.manage": {
        description: "Manage Telegram bots and integrations",
        scope: "team",
        containedPermissionIds: {},
      },
      "account_keys.manage": {
        description: "Manage vsk_ account API keys",
        scope: "team",
        containedPermissionIds: {},
      },
      "chat_keys.manage": {
        description: "Create/rotate vesp_ chat keys",
        scope: "team",
        containedPermissionIds: {},
      },
      "adult.manage_content": {
        description: "Manage adult content when workspace enabled",
        scope: "team",
        containedPermissionIds: {},
      },
      "members.manage": {
        description: "Invite/manage Editor and Viewer",
        scope: "team",
        containedPermissionIds: {
          $invite_members: true,
          $read_members: true,
          $remove_members: true,
        },
      },
      "members.manage_admins": {
        description: "Invite/promote/remove Admins",
        scope: "team",
        containedPermissionIds: {},
      },
      "billing.manage": {
        description: "Manage billing and seats",
        scope: "team",
        containedPermissionIds: {},
      },
      "workspace.update": {
        description: "Rename workspace",
        scope: "team",
        containedPermissionIds: {
          $update_team: true,
        },
      },
      "workspace.delete": {
        description: "Delete workspace",
        scope: "team",
        containedPermissionIds: {
          $delete_team: true,
        },
      },
      "ownership.transfer": {
        description: "Transfer workspace ownership",
        scope: "team",
        containedPermissionIds: {},
      },
      viewer: {
        description: "Read-only product role",
        scope: "team",
        containedPermissionIds: {
          "workspace.read": true,
          "personas.read": true,
          "knowledge.read": true,
          "chat_history.read": true,
        },
      },
      editor: {
        description: "Content builder role",
        scope: "team",
        containedPermissionIds: {
          viewer: true,
          "personas.write": true,
          "knowledge.write": true,
          "playground.run": true,
        },
      },
      admin: {
        description: "Ops role (no billing / no admin promotion)",
        scope: "team",
        containedPermissionIds: {
          editor: true,
          "content.publish": true,
          "content.archive": true,
          "connections.manage": true,
          "account_keys.manage": true,
          "chat_keys.manage": true,
          "adult.manage_content": true,
          "members.manage": true,
        },
      },
      owner: {
        description: "Workspace owner",
        scope: "team",
        containedPermissionIds: {
          admin: true,
          "members.manage_admins": true,
          "billing.manage": true,
          "workspace.update": true,
          "workspace.delete": true,
          "ownership.transfer": true,
        },
      },
    },
    defaultPermissions: {
      teamCreator: { owner: true },
      teamMember: { viewer: true },
    },
  },
};
