# Changelog
Developers are expected to log all changes to this directory to this changelog.

The Datro Consortium format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
and [Prince2 Highlight Reports](https://prince2.wiki/management-products/highlight-report/).

## [Unreleased]

## [0.0.1-rc.1-hbnb-arm] - Q1/2021

### PLAN

2021Q1 - Get the HotspotBnB ARM Architect (Raspberry Pi) 'net-installer' branch in better shape,
         so that anyone, anywhere can also compile a fresh disk image, which produces the same results

### PERFORMANCE
01-Mar - Made a build script, to help understand what's going on and automate the compiling of autonomated builder aka net-intaller (source code > img.xz), with one command (`sudo bash ./build.sh`).

#### Added
01-Mar - Noticed a .bashrc file was missing from the custom-settings directory. Placed it in there.

#### Changed
27-Feb - Minor edit to README.md

#### Fixed

#### Removed
01-Mar - results.log - intended for reporting how the build.sh performed, but ended up ditching it.

### ISSUES,RISKS,CONCERNS
01-Mar - Semantic versioning concern - 'rc' suffix applies to all the software compiler source code in this monorepo branch (net-installer)
       - Each software in this branch really needs its own suffix e.g. 'rc.1-hbnb-arm' and 'rc.1-togo-x86', or something to this effect
       - We expect the softwares will expand to support more architectures and the types of softwares for the network resources will expand e.g. hotspotbnb, to-go-usb, cacher, neo-dome etc

01-Mar - the build doesn't complete nicely. The buildroot.sh file needs reviewing. 

### PLAN MOVING FORWARD

