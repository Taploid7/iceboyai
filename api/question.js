import {
GoogleGenerativeAI
}
from "@google/generative-ai";



const genAI =
new GoogleGenerativeAI(
process.env.GEMINI_API_KEY
);



export default async function handler(req,res){



if(req.method !== "POST"){


return res.status(405)
.json({

error:
"POST only"

});


}



try{


const {

difficulty,
topic,
location

}

=
req.body || {};




const model =
genAI.getGenerativeModel({

model:
"gemini-2.0-flash"

});





const prompt = `

You are an elementary school teacher in Taiwan.

Create ONE fun educational question
for a children's game called:

"Ice Boy's Transformation"

The student is around Grade 3-6 level.

The student language level:
- Simple English
- Traditional Chinese support

Question requirements:

Location:
${location || "Snow Mountain"}

Topic:
${topic || "states of matter"}

Difficulty:
${difficulty || "easy"}


The question must teach:

- water states
- water cycle
- science vocabulary
- reading comprehension


Rules:

1. Write BOTH English and Traditional Chinese.

2. Use simple vocabulary.

3. Avoid complicated science terms.

4. Make it fun like a story game.

5. Return ONLY JSON.

6. Agegroup: Taiwan elementary Grade 4 level English. 


JSON format:

{

"question_en":
"",

"question_zh":
"",


"choices":[

{
"en":"",
"zh":""
}

],


"answer":0,


"explanation_en":
"",


"explanation_zh":
""

}


`;




const result =
await model.generateContent(
prompt
);



let text =
result.response.text();



text =
text
.replace(/```json/g,"")
.replace(/```/g,"")
.trim();




const json =
JSON.parse(text);



res.status(200)
.json(json);



}



catch(error){


console.error(error);



res.status(500)
.json({

error:
"Gemini generation failed"

});


}



}