import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { getPronounciationToken } from "../app/actions";


export function onRecognizedResult(result, reco) {
    var pronunciation_result = sdk.PronunciationAssessmentResult.fromResult(result);
    console.log(" Accuracy score: ", pronunciation_result.accuracyScore, '\n',
        "pronunciation score: ", pronunciation_result.pronunciationScore, '\n',
        "completeness score : ", pronunciation_result.completenessScore, '\n',
        "fluency score: ", pronunciation_result.fluencyScore, '\n',
        "prosody score: ", pronunciation_result.prosodyScore
    );
    console.log("  Word-level details:");
    pronunciation_result.detailResult.Words.forEach((word, idx) => {
        console.log("    ", idx + 1, ": word: ", word.Word, "\taccuracy score: ", word.PronunciationAssessment?.AccuracyScore, "\terror type: ", word.PronunciationAssessment?.ErrorType, ";");
    });
    reco.close();
}

export async function stopRecognize(recognizer: sdk.SpeechRecognizer) {
    recognizer.stopContinuousRecognitionAsync(
        function() {},
        function (err) {
            console.log("stopContinuousRecognitionAsync ERROR: " + err);
            // supposed to exit here
        }
    )
}

export async function startRecognize(mediaStream: MediaStream, language: string, referenceText?: string) {
    /** Writing WAV Headers into the buffer received. */
    const token = await getPronounciationToken();
    var speechConfig = sdk.SpeechConfig.fromAuthorizationToken(token.token, token.region);
    // setting the recognition language to English.
    speechConfig.speechRecognitionLanguage = language;
        /** On finish, read the WAV stream using configuration the SDK provides. */
    let audioConfig = sdk.AudioConfig.fromStreamInput(mediaStream);

    // create pronunciation assessment config, set grading system, granularity and if enable miscue based on your requirement.
    const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
        referenceText ? referenceText : "",
        sdk.PronunciationAssessmentGradingSystem.HundredMark,
        sdk.PronunciationAssessmentGranularity.Phoneme,
        true
    );

    pronunciationAssessmentConfig.enableProsodyAssessment = true;

    // create the speech recognizer.
    var reco = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    // (Optional) get the session ID
    reco.sessionStarted = (_s, e) => {
        console.log(`SESSION ID: ${e.sessionId}`);
    };

    reco.recognized = function (s, e) {
        onRecognizedResult(e.result, reco)
    }

    reco.sessionStopped = function (s, e) {
        reco.close();
    };

    pronunciationAssessmentConfig.applyTo(reco);

    reco.startContinuousRecognitionAsync(
        function () {
        },
        function (err) {
            console.log("startContinuousRecognitionAsync ERROR: " + err);
            // supposed to exit here
        }
    );

    return reco;
  }