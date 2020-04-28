import yaml, sys

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

def capitalize_first_char(s):
    l = list(s)
    l[0] = l[0].capitalize()
    return "".join(l)

def patch_definitions(parsed_yaml):
    eprint("Patching definitions")
    for definition, content in parsed_yaml["definitions"].items():
        if "enum" in content:
            content["x-ms-enum"] = { "name": content.get("x-type-name", definition) }

def patch_parameters(parsed_yaml):
    eprint("Patching parameters")
    for definition, content in parsed_yaml["parameters"].items():
        content["x-ms-parameter-location"] = 'method'
        if "enum" in content:
            content["x-ms-enum"] = { "name": content["x-type-name"] }

def open_file(input_file_name):
    eprint("Parsing swagger definition")
    yaml_file = open(input_file_name)
    return yaml.load(yaml_file, Loader=yaml.FullLoader)

def write_file(yaml_file, output_file_name):
    eprint("Writing patched swagger definition")
    with open(output_file_name, 'w') as file:
        output = yaml.dump(yaml_file, file, default_flow_style=False, sort_keys=False, Dumper=yaml.SafeDumper)

def main():
    input_file = sys.argv[1]
    output_file = sys.argv[2]

    yaml_file = open_file(input_file)
    patch_definitions(yaml_file)
    patch_parameters(yaml_file)
    write_file(yaml_file, output_file)
    eprint("Patch done")

if __name__ == "__main__":
    main()
