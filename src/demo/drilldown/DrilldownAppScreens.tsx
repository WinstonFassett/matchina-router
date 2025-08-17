import type React from "react";
import { characters, episodes } from "./data";
import { Link, useRouter, type RouteName } from "./router";

const Page: React.FC<
  { title?: string } & React.HTMLAttributes<HTMLDivElement>
> = ({ title, children, className, ...rest }) => (
  <div className={"max-w-[600px] mx-auto my-4 " + (className ?? "")} {...rest}>
    {title ? (
      <h2 className="my-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h2>
    ) : null}
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm">
      {children}
    </div>
  </div>
);

const ListLink: React.FC<
  React.PropsWithChildren<{ name: RouteName; params?: any }>
> = ({ name, params, children }) => (
  <li className="list-none border-t border-black/5 dark:border-white/10">
    <Link
      name={name}
      params={params}
      className="flex px-3 py-2 no-underline hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
    >
      <span className="flex-1">{children}</span>
      <span aria-hidden>›</span>
    </Link>
  </li>
);
const BackButton: React.FC = () => {
  const { to } = useRouter();
  let back: { name: RouteName; params?: any } = { name: "Home" };
  if (to?.name === "Characters") back = { name: "Home" };
  else if (to?.name === "Episodes") back = { name: "Home" };
  else if (to?.name === "CharacterDetail") back = { name: "Characters" };
  return (
    <div className="px-4 py-3">
      <Link
        name={back.name}
        params={back.params}
        className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
      >
        ← Back
      </Link>
    </div>
  );
};
export const TopView: React.FC = () => (
  <Page title="The Simpsons">
    <ul style={{ margin: 0, padding: 0 }}>
      <ListLink name="Characters">Characters</ListLink>
      <ListLink name="Episodes">Episodes</ListLink>
    </ul>
  </Page>
);
export const CharactersView: React.FC = () => (
  <Page title="Characters">
    <BackButton />
    <ul style={{ margin: 0, padding: 0 }}>
      {characters.map(({ name }, id) => (
        <ListLink key={id} name="CharacterDetail" params={{ id: String(id) }}>
          {name}
        </ListLink>
      ))}
    </ul>
  </Page>
);
export const CharacterView: React.FC<{ id: string }> = ({ id }) => {
  const idx = parseInt(id, 10);
  const character = characters[idx];
  if (!character) {
    return (
      <Page>
        <BackButton />
        <div style={{ padding: 16 }}>Character not found: {id}</div>
      </Page>
    );
  }
  return (
    <Page>
      <BackButton />
      <div style={{ padding: 16 }}>
        <div style={{ opacity: 0.65, marginBottom: 6 }}>Character</div>
        <h3 style={{ margin: "6px 0" }}>{character.name}</h3>
        <div>{character.role}</div>
      </div>
    </Page>
  );
};
export const EpisodesView: React.FC = () => (
  <Page title="Episodes">
    <BackButton />
    <ul style={{ margin: 0, padding: 0 }}>
      {episodes.map(({ title }, key) => (
        <li
          key={key}
          style={{
            listStyle: "none",
            borderTop: "1px solid rgba(0,0,0,0.06)",
            padding: "12px 14px",
          }}
        >
          {title}
        </li>
      ))}
    </ul>
  </Page>
);
