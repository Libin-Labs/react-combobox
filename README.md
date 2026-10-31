# @lp-labs/react-combobox

Searchable single/multiple selects with abortable async options and keyboard navigation. React 18+ peer only; ESM, CommonJS and TypeScript included. No CSS import required.

## Installation

```sh
npm install @lp-labs/react-combobox
```

## Quick Start

```jsx
import { useState } from 'react';
import { Combobox } from '@lp-labs/react-combobox';
export default function Example() {
  const [value, setValue] = useState(null);
  return (
    <Combobox
      label="Fruit"
      value={value}
      onChange={setValue}
      options={[
        { value: 'apple', label: 'Apple' },
        { value: 'pear', label: 'Pear' },
      ]}
    />
  );
}
```

## API

Options contain unique string/number value, text label and optional disabled. Props: options, value/defaultValue (single ID/null or multiple ID array), onChange, multiple=false, disabled, label, placeholder, name, className and renderOption(option,{selected,active}). Controlled values require onChange. name renders hidden form inputs. Multiple selections have remove buttons.

`loadOptions(query,{signal})` replaces local options with async results; debounce defaults to 200 ms (0–5,000 ms). Requests abort on query change/close/unmount and stale results are ignored. Results are additionally filtered by label substring. Errors render an alert. Arrow keys wrap enabled options; Home/End jump, Enter selects, Escape closes and Tab leaves. The search field owns combobox/listbox semantics; custom option content must be presentational.

## Benefits

| Area                          | Details                                                 |
| ----------------------------- | ------------------------------------------------------- |
| Async options                 | Search requests are debounced and stale requests abort. |
| Single and multiple selection | Use the same control and option model.                  |
| Customization hooks           | Render options without taking over list behavior.       |

## Customization

| Area           | Details                                                              |
| -------------- | -------------------------------------------------------------------- |
| Option data    | Provide unique values, labels, disabled state, and custom rendering. |
| Remote loading | Set loader, debounce, option, selection, and visible-row caps.       |
| Presentation   | Configure labels, placeholder, class name, and mode.                 |

## Security And Limits

Defaults: maxOptions: 10,000, maxSelected: 1,000, and maxVisible: 100. Hard caps are 10,000/1,000/1,000; query text to 256 characters. Only the capped visible prefix is rendered; refine the search for more options. No virtualization, fuzzy ranking, portal placement or server authorization is included. Labels render as text unless your renderer changes that. Do not pass untrusted HTML through a custom renderer. SSR renders a closed combobox; browser focus/keyboard behavior requires a modern browser.

## Support

[Donate via PayPal](https://www.paypal.me/LibinPrasanth). Author: [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/).

## License

MIT License. See the packaged [LICENSE](LICENSE) file.
