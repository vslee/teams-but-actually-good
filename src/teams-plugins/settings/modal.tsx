import * as React from "react";
import { Plugin } from "../../interface";
import {
  Author,
  OptionType,
  PluginSettingComponentDef,
  PluginSettingDef,
  PluginStorageValue,
} from "../../types/types";
import { setPluginSetting } from "../../utils/storage";

interface SettingModalProps {
  ReactLib: typeof React;
  plugin: Plugin;
  onClose(): void;
  needRestart?: boolean;
  setNeedRestart?: (need: boolean) => void;
}

function renderAuthors(
  ReactLib: typeof React,
  author: Author | Author[] | undefined,
): React.ReactNode {
  void ReactLib;
  if (!author) return null;
  const authors = Array.isArray(author) ? author : [author];
  /** @jsx ReactLib.createElement */
  return (
    <div className="tbg-author-list">
      {authors.map((a, i) => (
        <a
          key={i}
          className="tbg-author-avatar"
          title={a.name}
          href={a.socialMediaUrl}
          target="_blank"
          rel="noreferrer"
          onClick={(e: React.MouseEvent) => {
            if (!a.socialMediaUrl) e.preventDefault();
          }}
        >
          {a.profileAvatarUrl ? (
            <img src={a.profileAvatarUrl} alt={a.name} />
          ) : (
            <span>{a.name.charAt(0).toUpperCase()}</span>
          )}
        </a>
      ))}
    </div>
  );
}

function renderControl(
  ReactLib: typeof React,
  settingKey: string,
  def: PluginSettingDef,
  value: PluginStorageValue,
  onChange: (newValue: PluginStorageValue) => void,
): React.ReactNode {
  void ReactLib; // used by the @jsx pragma below for JSX element creation
  switch (def.type) {
    case OptionType.BOOLEAN:
      /** @jsx ReactLib.createElement */
      return (
        <div
          className="tbg-switch"
          role="switch"
          tabIndex={0}
          data-checked={String(value === true)}
          onClick={() => onChange(!value)}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              onChange(!value);
            }
          }}
        >
          <div className="tbg-switch__indicator">
            <svg
              fill="currentColor"
              aria-hidden="true"
              width="1em"
              height="1em"
              viewBox="0 0 20 20"
            >
              <path
                d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
      );

    case OptionType.STRING:
      /** @jsx ReactLib.createElement */
      return def.multiline ? (
        <textarea
          className="tbg-input tbg-textarea"
          placeholder={def.placeholder}
          value={String(value ?? "")}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            onChange(e.target.value)
          }
          rows={3}
        />
      ) : (
        <input
          className="tbg-input"
          type="text"
          placeholder={def.placeholder}
          value={String(value ?? "")}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.value)
          }
        />
      );

    case OptionType.NUMBER:
      /** @jsx ReactLib.createElement */
      return (
        <input
          className="tbg-input"
          type="number"
          placeholder={def.placeholder}
          value={String(value ?? 0)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(Number(e.target.value))
          }
        />
      );

    case OptionType.BIGINT:
      /** @jsx ReactLib.createElement */
      return (
        <input
          className="tbg-input"
          type="number"
          placeholder={def.placeholder}
          value={String(value ?? 0)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            try {
              onChange(BigInt(e.target.value));
            } catch {
              /* invalid mid-edit */
            }
          }}
        />
      );

    case OptionType.SELECT:
      /** @jsx ReactLib.createElement */
      return (
        <select
          className="tbg-input tbg-select"
          value={String(value ?? "")}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            const opt = def.options.find(
              (o) => String(o.value) === e.target.value,
            );
            if (opt) onChange(opt.value);
          }}
        >
          {def.options.map((opt) => (
            <option key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case OptionType.SLIDER: {
      const listId = `tbg-slider-${settingKey}`;
      /** @jsx ReactLib.createElement */
      return (
        <div className="tbg-slider-wrapper">
          <input
            type="range"
            className="tbg-slider"
            list={def.stickToMarkers ? listId : undefined}
            min={def.markers[0]}
            max={def.markers[def.markers.length - 1]}
            step={def.stickToMarkers ? undefined : "any"}
            value={Number(value ?? def.default)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(Number(e.target.value))
            }
          />
          <datalist id={listId}>
            {def.markers.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          <div className="tbg-slider-labels">
            {def.markers.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
      );
    }

    case OptionType.COMPONENT: {
      const Comp = def.component as PluginSettingComponentDef["component"];
      return ReactLib.createElement(Comp, {
        setValue: onChange,
        option: def,
        value,
        ReactLib,
      });
    }

    case OptionType.CUSTOM:
    default:
      return null;
  }
}

function renderField(
  ReactLib: typeof React,
  settingKey: string,
  def: PluginSettingDef,
  value: PluginStorageValue,
  onChange: (newValue: PluginStorageValue) => void,
): React.ReactNode {
  if (def.type === OptionType.CUSTOM) return null;

  if (def.type === OptionType.COMPONENT) {
    return renderControl(ReactLib, settingKey, def, value, onChange);
  }

  if (def.hidden) return null;

  const control = renderControl(ReactLib, settingKey, def, value, onChange);
  if (control === null) return null;

  /** @jsx ReactLib.createElement */
  return (
    <div key={settingKey} className="tbg-setting-row">
      <div className="tbg-setting-label">
        <span className="tbg-setting-name">
          {settingKey.charAt(0).toUpperCase() +
            settingKey.slice(1).replace(/([A-Z])/g, " $1")}
        </span>
        <span className="tbg-setting-description">{def.description}</span>
        {def.restartNeeded && (
          <span className="tbg-setting-restart">Restart needed</span>
        )}
      </div>
      <div className="tbg-setting-control">{control}</div>
    </div>
  );
}

export default function SettingModal({
  ReactLib,
  plugin,
  onClose,
  needRestart,
  setNeedRestart,
}: SettingModalProps) {
  const [values, setValues] = ReactLib.useState<Record<string, unknown>>(
    plugin.settings ?? {},
  );

  function handleChange(
    key: string,
    def: PluginSettingDef,
    newValue: PluginStorageValue,
  ) {
    setValues((prev: Record<string, unknown>) => ({
      ...prev,
      [key]: newValue,
    }));
    setPluginSetting(plugin.name, key, newValue);
    if (plugin.settings) plugin.settings[key] = newValue;
    def.onChange?.(newValue);
    if (def.type !== OptionType.CUSTOM && def.restartNeeded)
      setNeedRestart?.(true);
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  ReactLib.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const entries = Object.entries(plugin.settingsDef ?? {}).filter(
    ([, def]) => def.type !== OptionType.CUSTOM && !def.hidden,
  );

  /** @jsx ReactLib.createElement */
  return (
    <div className="tbg-modal-backdrop" onClick={handleBackdropClick}>
      <div className="tbg-modal">
        <div className="tbg-modal-header">
          <span className="tbg-modal-title">{plugin.name}</span>
          {renderAuthors(ReactLib, plugin.author)}
          <button
            className="tbg-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            x
          </button>
        </div>
        {plugin.description && (
          <p className="tbg-modal-subtitle">{plugin.description}</p>
        )}
        <div className="tbg-modal-body">
          {entries.length === 0 ? (
            <p className="tbg-setting-description">No configurable settings.</p>
          ) : (
            entries.map(([key, def]) =>
              renderField(
                ReactLib,
                key,
                def,
                values[key] as PluginStorageValue,
                (v) => handleChange(key, def, v as PluginStorageValue),
              ),
            )
          )}
        </div>
        <div className="tbg-modal-footer">
          {needRestart ? (
            <button
              className="tbg-button-primary"
              onClick={() => window.location.reload()}
            >
              Restart Teams to apply changes
            </button>
          ) : entries.length > 0 ? (
            <button className="tbg-button-secondary" onClick={onClose}>
              Save
            </button>
          ) : (
            <button className="tbg-button-secondary" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
