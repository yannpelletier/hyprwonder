export type CliRequest = {
  command: string;
  flags: string[];
  params: Record<string, string>;
}

export const parseCliInput = (input: string): CliRequest => {
  // Split input while preserving quoted strings
  const tokens = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  if (!tokens[0] || tokens.length === 0) {
    return {
      command: "",
      flags: [],
      params: {}
    };
  }

  const command = tokens[0];
  const flags = [] as string[];
  const params = {} as Record<string, string>;

  // Process remaining tokens
  let i = 1;
  while (i < tokens.length) {
    const token = tokens[i];

    // Check if token is a parameter (starts with --)
    if (token.startsWith('--')) {
      const key = token.slice(2); // Remove --

      // Check for = in key=value format
      const equalIndex = key.indexOf('=');
      if (equalIndex !== -1) {
        const paramKey = key.slice(0, equalIndex);
        const paramValue = key.slice(equalIndex + 1).replace(/^"|"$/g, ''); // Remove quotes if present
        params[paramKey] = paramValue;
        i++;
        continue;
      }

      // Check if next token is a value (not another --param)
      const nextToken = tokens[i + 1];
      if (nextToken && !nextToken.startsWith('--')) {
        // Treat next token as value, remove quotes if present
        params[key] = nextToken.replace(/^"|"$/g, '');
        i += 2; // Skip value
      } else {
        // No value, treat as flag
        flags.push(key);
        i++;
      }
    } else {
      // Skip non-parameter tokens (e.g., values already processed)
      i++;
    }
  }

  return {
    command,
    flags,
    params,
  };
}

export const escapeCLIArgument = (arg: string) => {
  return arg.replace(/([\\|&;<>()$`~#*?{}[\]\n^$.])/g, "\\$1");
};
