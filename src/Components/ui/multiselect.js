import Select from 'react-select';

export function MultiSelect({ options, value, onChange }) {
  return (
    <Select
      isMulti
      options={options}
      value={options.filter((opt) => value.includes(opt.value))}
      onChange={(selected) => onChange(selected.map((s) => s.value))}
    />
  );
}
