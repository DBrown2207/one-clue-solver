"use strict";

const fetchLines = async setLines => {
  const fileStream = await fetch("./words_alpha.txt");
  if (!fileStream.ok || fileStream.status !== 200) {
    console.error("file not found");
  }
  const words = await fileStream.text();
  setLines(words.split(/\n|\r/));
};
const useLines = () => {
  const [lines, setLines] = React.useState([]);
  React.useEffect(() => {
    fetchLines(setLines);
  }, []);
  return lines;
};
const useInputEventHandler = (valueMapper, initialValue = "") => {
  const [value, setValue] = React.useState(initialValue);
  const [mappedOut, setMappedOut] = React.useState();
  const handler = React.useCallback(event => {
    setValue(event.target.value);
    try {
      setMappedOut(valueMapper(event.target.value));
    } catch (e) {
      setMappedOut(undefined);
    }
  }, []);
  return [mappedOut, handler, value];
};
const getPossibleWords = (lines, inputString, knownPatternRegex) => {
  if (!inputString || !knownPatternRegex) {
    return [];
  }
  const input = inputString.split("").reduce((prev, curr) => {
    const count = prev[curr] ? prev[curr].count : 0;
    return {
      ...prev,
      [curr]: { count: count + 1, regex: new RegExp(`${curr}`, "gi") }
    };
  }, {});
  const inputValsRegex = new RegExp(`^[${Object.keys(input).join()}]*$`, "i");
  return lines
    .filter(line => inputValsRegex.test(line) && knownPatternRegex.test(line))
    .filter(
      line =>
        !Object.keys(input).some(char => {
          const matched = line.match(input[char].regex);
          return matched && matched.length > input[char].count;
        })
    )
    .join(`\n`);
};
const LabeledInput = ({ id, onChange, value, error }) => {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "label",
      { htmlFor: id },
      id,
      " ",
      error &&
        React.createElement("span", { className: "error" }, "invalid input")
    ),
    React.createElement("input", {
      id: id,
      name: name,
      onChange: onChange,
      value: value
    })
  );
};
const App = () => {
  const lines = useLines();
  const [inputString, setInputString, inputStringValue] = useInputEventHandler(
    val => {
      if (!/^[a-z]+$/i.test(val)) throw new Error("invalid inputString input");
      return val;
    }
  );
  const [
    knownPattern,
    setKnownPattern,
    knownPatternString
  ] = useInputEventHandler(val => {
    if (val.length === 0) throw new Error("no knownPattern input");
    return new RegExp(`^${val}$`, "i");
  });
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(LabeledInput, {
      id: "inputString",
      value: inputStringValue,
      onChange: setInputString,
      error: !inputString
    }),
    React.createElement(LabeledInput, {
      id: "knownPattern",
      value: knownPatternString,
      onChange: setKnownPattern,
      error: !knownPattern
    }),
    React.createElement(
      "pre",
      null,
      getPossibleWords(lines, inputString, knownPattern)
    )
  );
};

ReactDOM.render(React.createElement(App, null), document.getElementById("app"));
