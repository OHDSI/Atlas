library(DatabaseConnector)
library(FeatureExtraction)

connectionDetails <- createConnectionDetails(dbms="postgresql",
                                             connectionString="jdbc:postgresql://localhost:5432/synpuf_110k_cu",
                                             user="ohdsi",
                                             password="ohdsi",
                                             schema="five_three_plus")
cdmDatabaseSchema <- "five_three_plus"
resultsDatabaseSchema <- "five_three_plus_results"

settings <- createCovariateSettings(useDemographicsGender = TRUE,
                                    useDemographicsAgeGroup = TRUE)

aspirinUsersCovariateAggData <- getDbCovariateData(connectionDetails = connectionDetails,
                                                cdmDatabaseSchema = cdmDatabaseSchema,
                                                cohortDatabaseSchema = resultsDatabaseSchema,
                                                cohortTable = "cohort",
                                                cohortId = 12,
                                                rowIdField = "subject_id",
                                                covariateSettings = settings,
                                                aggregated = TRUE)

aspirinUsersCovariateAggData$covariates

clopidogrelUsersCovariateAggData <- getDbCovariateData(connectionDetails = connectionDetails,
                                    cdmDatabaseSchema = cdmDatabaseSchema,
                                    cohortDatabaseSchema = resultsDatabaseSchema,
                                    cohortTable = "cohort",
                                    cohortId = 11,
                                    rowIdField = "subject_id",
                                    covariateSettings = settings,
                                    aggregated = TRUE)

computeStandardizedDifference(aspirinUsersCovariateAggData, clopidogrelUsersCovariateAggData)

computeStandardizedDifference(clopidogrelUsersCovariateAggData, aspirinUsersCovariateAggData)


#####

library(jsonlite)

PrespecAnalyses <- read.csv(file=paste(path.package("FeatureExtraction"), "/csv/PrespecAnalyses.csv", sep = ""), stringsAsFactors = FALSE)

convertCovDataToCCResult <- function(covDataList) {

  ccResult <- list(
    analyses = list()
  )

  baseCovData <- covDataList[[1]]
  analysisIds <- unique(baseCovData$covariateRef$analysisId)

  for(i in 1:length(analysisIds)) {
    analysisId <- analysisIds[i]
    domainId <- PrespecAnalyses[PrespecAnalyses$analysisId == analysisId,]$domainId
    analysisName <- PrespecAnalyses[PrespecAnalyses$analysisId == analysisId,]$analysisName

    ccResult$analyses[[i]] <- list(
      analysisId = analysisId,
      domainId = domainId,
      analysisName = analysisName,
      reports = list()
    )
  }

  for(covDataIdx in 1:length(covDataList)) {

    covData <- covDataList[[covDataIdx]]

    cohortId = as.numeric(covData$metaData$cohortId)
    fullCovs <- merge(covData$covariateRef, covData$covariates, by = "covariateId")

    for(i in 1:length(analysisIds)) {

      analysisId <- analysisIds[i]
      domainId <- PrespecAnalyses[PrespecAnalyses$analysisId == analysisId,]$domainId
      analysisName <- PrespecAnalyses[PrespecAnalyses$analysisId == analysisId,]$analysisName
      stats <- list()

      covs <- fullCovs[fullCovs$analysisId == analysisId,]

      for (row in 1:nrow(covs)) {
        covariateId <- covs[row, "covariateId"]
        averageValue  <- covs[row, "averageValue"]
        sumValue  <- covs[row, "sumValue"]
        covName <- covs[row, "covariateName"]
        conceptId <- covs[row, "conceptId"]
        pct <- sumValue / covData$metaData$populationSize * 100

        stats[[row]] <- list(
          covariateId = covariateId,
          covariateName = covName,
          conceptId = conceptId,
          averageValue = averageValue,
          sumValue = sumValue,
          pct = pct
        )
      }

      ccResult$analyses[[i]]$reports[[covDataIdx]] <- list(
        cohortId = cohortId,
        stats = stats
      )
    }
  }

  json <- toJSON(ccResult,auto_unbox=TRUE)
  prettify(json)

}

convertCovDataToCCResult(list(aspirinUsersCovariateAggData, clopidogrelUsersCovariateAggData))