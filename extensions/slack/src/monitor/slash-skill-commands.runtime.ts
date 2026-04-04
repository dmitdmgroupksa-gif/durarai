import { listSkillCommandsForAgents as listSkillCommandsForAgentsImpl } from "Durar/plugin-sdk/command-auth";

type ListSkillCommandsForAgents =
  typeof import("Durar/plugin-sdk/command-auth").listSkillCommandsForAgents;

export function listSkillCommandsForAgents(
  ...args: Parameters<ListSkillCommandsForAgents>
): ReturnType<ListSkillCommandsForAgents> {
  return listSkillCommandsForAgentsImpl(...args);
}
