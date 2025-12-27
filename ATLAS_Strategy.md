# ATLAS/WebAPI Strategy

The following strategy for ATLAS/WebAPI follows the format as described in [Red Hat's "Developing a strategy for your open source project"](https://www.redhat.com/en/resources/developing-strategy-open-source-project). 

## 1. What is the project?

ATLAS/WebAPI is a web-based tool for desiging observational studies using [HADES Standardized Analytics](https://ohdsi.github.io/Hades/) for patient-level health data converted to the OMOP Common Data Model. 

## 2. Who are the project's users?

ATLAS/WebAPI's users are researchers (individuals and teams) who want to design cohort definitions. They will then use these cohort definitions to run analytics to perform characterization, and population-level effect estimation and patient-level prediction for these populations of patients.

## 3. How do you engage with your user base today?

Users of ATLAS are encouraged to participate in the [ATLAS/WebAPI Working group](https://www.ohdsi.org/workgroups/).

## 4. What alternatives to your project already exist?

[i2b2](https://www.i2b2.org/software/index.html) provides an open-source cohort definition solution that is now compatible with the OMOP CDM.

## 5. Are you already associated with adjacent projects?

ATLAS/WebAPI is adjacent to a number of projects in the OHDSI open-source ecosystem. ATLAS/WebAPI provides a designer for [HADES Standardized Analytics](https://ohdsi.github.io/Hades/). [Athena](https://athena.ohdsi.org) provides capabilities to search the OMOP Vocabularies to download these vocabularies. [ARES](https://ohdsi.github.io/Ares/) provides database level characterization and data quality assessments. [Arachne](https://github.com/OHDSI/Arachne) provides the capabilities to execute studies designed in ATLAS.

## 6. What are your goals for the project?

We have the following goals and priorities for the ATLAS/WebAPI project:

- **ATLAS for phenotype development and evaluation**: ATLAS will provide a cohesive set of features for phenotype development and storage.
- **ATLAS for study design and execution via Arachne & Strategus**: currently cohorts are the only reusable element of design that is produced by ATLAS for consumption in Strategus. We should aim to make all of the Strategus HADES modules available for design in ATLAS. We should also have a documented solution for running Strategus via Arachne integrated with ATLAS. 
- **Modernize the application stack**: ATLAS/WebAPI has fallen behind on some core libraries which require prioritization to fix.

## 7. Who are your key stakeholders?

Researchers who want to design observational studies using the OMOP CDM.