import { FC, useCallback, useEffect, useMemo, useState } from "react";

import { Spinner } from "@components/Spinner";
import {
  SlideOver,
  SlideOverProps,
  SlideOverHeading,
  SlideOverFooter,
  SlideOverBody,
} from "@components/SlideOver";
import { TextInput } from "@components/TextInput";
import { GithubConnector } from "@components/GithubConnector";
import { Toggle } from "@components/Toggle";
import { useProjectCreator } from "@hooks/useProjectCreator";
import { useOrganization } from "@hooks/useOrganization";
import { useProjects } from "@hooks/useProjects";
import { ExclamationCircleIcon } from "@heroicons/react/outline";

export const NewProjectSlideOver: FC<SlideOverProps> = ({ open, onClose }) => {
  const organization = useOrganization();
  const { projects } = useProjects();
  const { createProject, creating, form } = useProjectCreator();

  const reachedLimit = useMemo(
    () =>
      projects &&
      Object.keys(projects).length >=
        organization.organizationPlan.projectsLimit,
    [organization, projects]
  );

  const close = () => {
    setTimeout(() => form.reset(), 700);
    onClose();
  };

  useEffect(() => form.reset(), []);

  const submit = useCallback(() => {
    if (form.isValid) {
      createProject().then(close);
    }
  }, [
    form.name,
    form.alias,
    form.githubInstallation,
    form.assetsPath,
    form.publicPageEnabled,
    form.isValid,
  ]);

  return (
    <SlideOver open={open} onClose={close} onSubmit={submit}>
      <SlideOverHeading onClose={close} title="New Project" />

      {reachedLimit && (
        <div className="px-4 sm:px-6 py-2 bg-zinc-200 text-zinc-600 flex gap-2 items-center">
          <ExclamationCircleIcon className="w-5 h-5" />
          <span className="flex-grow text-sm">
            You&apos;ve reached projects limit
          </span>
          <button
            type="button"
            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-zinc-600 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
          >
            Upgrade
          </button>
        </div>
      )}

      <SlideOverBody>
        <TextInput
          id="project-name"
          name="project-name"
          label="Project name"
          placeholder="My Awesome Project"
          disabled={reachedLimit || creating}
          value={form.name}
          onChange={form.setName}
        />

        <div className="border-b border-gray-200" />

        <GithubConnector
          onChange={form.setGithubInstallation}
          layout="column"
        />

        <TextInput
          id="assets-path"
          name="assets-path"
          label="Assets path"
          placeholder="/path/to/icons"
          disabled={reachedLimit || creating}
          value={form.assetsPath}
          onChange={form.setAssetsPath}
        />

        <div className="border-b border-gray-200" />

        <Toggle
          label="Enable public page?"
          description={`https://assetier.app/public/${
            form.alias || "<project-alias>"
          }`}
          checked={form.publicPageEnabled}
          onChange={form.setPublicPageEnabled}
        />

        {form.publicPageEnabled && (
          <TextInput
            id="project-alias"
            name="project-alias"
            label="Project alias"
            placeholder="if not set, will be generated"
            disabled={reachedLimit || creating}
            value={form.alias}
            onChange={form.setAlias}
          />
        )}
      </SlideOverBody>

      <SlideOverFooter>
        <button
          type="button"
          className="bg-white py-2 px-4 border disabled:opacity-50 border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
          disabled={creating}
          onClick={close}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={reachedLimit || creating || !form.isValid}
          className="ml-4 inline-flex items-center disabled:opacity-50 justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-zinc-600 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500"
        >
          <span>Create</span>
          {creating && <Spinner className="ml-2" />}
        </button>
      </SlideOverFooter>
    </SlideOver>
  );
};
