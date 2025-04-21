# Platform CLI

A command-line tool for generating standardized projects across multiple technology stacks with a plugin-based architecture.

## Features

- Unified CLI for generating projects from templates
- Support for multiple technology stacks (Java Spring Boot, React, etc.)
- Plugin-based architecture for extending functionality
- Templates pulled from GitHub repositories
- Variable substitution for customizing templates
- Cross-platform compatibility

## Installation

### Prerequisites

- Node.js 14.x or higher
- Git
- Access to template repositories

### Install from Source

```bash
# Clone the repository
git clone https://github.com/rcdelacruz/platform-cli.git
cd platform-cli

# Install dependencies
npm install

# Link the CLI for global usage
npm link
```

## Usage

### Generate a Project

Generate a new project from a template:

```bash
# Basic usage
platform generate java-spring --name=my-service

# With package name (for Java projects)
platform generate java-spring --name=my-service --package=com.example.myservice

# Specify output directory
platform generate java-spring --name=my-service --output=/path/to/output

# Use plugins
platform generate java-spring --name=my-service --with-plugins=security-jwt,database-postgresql

# Use a specific GitHub organization
platform generate java-spring --name=my-service --org=your-org

# Use a specific GitHub repository and branch
platform generate java-spring --name=my-service --repo=custom-template --branch=develop
```

### Available Templates

- `java-spring`: Java Spring Boot application
- `react`: React frontend application
- More templates coming soon!

### Command Options

```
Usage: platform generate [options] <template>

Generate a new project from a template

Arguments:
  template                    Template name (e.g., java-spring, react)

Options:
  -n, --name <n>              Project name
  -o, --output <dir>          Output directory (defaults to ./<n>)
  -p, --package <package>     Package name (for Java projects)
  --with-plugins <plugins>    Comma-separated list of plugins to apply
  --org <organization>        GitHub organization for template repository
  --repo <repository>         GitHub repository name for template
  --branch <branch>           Git branch to use (defaults to main)
  -h, --help                  Display help for command
```

## Configuration

The CLI can be configured using a `.platform-cli.json` file in your home directory or the current working directory:

```json
{
  "templates": {
    "java-spring": {
      "source": "git",
      "org": "your-organization",
      "repo": "platform-template-java-spring",
      "branch": "main"
    },
    "react": {
      "source": "git",
      "org": "your-organization",
      "repo": "platform-template-react",
      "branch": "main"
    }
  },
  "pluginPrefix": "platform-cli-plugin-",
  "templateDir": "./templates"
}
```

## Template Structure

Templates are pulled from GitHub repositories and should follow this structure:

```
platform-template-java-spring/
├── .github/workflows/        # GitHub Actions workflows
├── src/                      # Source code
├── .gitignore                # Git ignore file
├── Dockerfile                # Docker configuration
├── README.md                 # Template documentation
└── pom.xml                   # Maven configuration
```

### Template Variables

Templates can include variables that will be replaced during generation:

- `{{name}}`: Project name
- `{{packageName}}`: Package name (for Java projects)
- `${projectName}`: Alternative syntax for project name
- `${packageName}`: Alternative syntax for package name
- `__packageDir__`: Package directory path (com/example/project)

## Plugin System

The CLI includes a plugin system for extending functionality. Plugins can modify templates, add features, and more.

### Built-in Plugins

- Security plugins (JWT, OAuth, etc.)
- Database plugins (PostgreSQL, MySQL, etc.)
- More coming soon!

### Plugin Development

Plugins should implement the `PluginInterface` and can be installed via npm or locally.

## Contributing

We welcome contributions! Please follow these steps to contribute:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
