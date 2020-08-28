var myJson = {
    "country": [
        {
            "name": "United States",
            "id": "usa",
            "states": [
                {
                    "name": "State 1 USA",
                    "id": "usaState1",
                    "cities": [
                        {
                            "name": "City 1",
                            "id": "usaState1City1",
                            "area": "12345 sqkm"
                        },
                        {
                            "name": "City 2",
                            "id": "usaState1City2",
                            "area": "12345 sqkm"
                        }
                    ]
                },
                {
                    "name": "State 2 USA",
                    "id": "usaState2",
                    "cities": [
                        {
                            "name": "City 3",
                            "id": "usaState2City3",
                            "area": "12345 sqkm"
                        },
                        {
                            "name": "City 4",
                            "id": "usaState2City4",
                            "area": "12345 sqkm"
                        }
                    ]
                }
            ]
        },
        {
            "name": "Australia",
            "id": "aus",
            "states": [
                {
                    "name": "State 1 Australia",
                    "id": "ausState1",
                    "cities": [
                        {
                            "name": "City 5",
                            "id": "ausState1City5",
                            "area": "12345 sqkm"
                        },
                        {
                            "name": "City 6",
                            "id": "ausState1City6",
                            "area": "12345 sqkm"
                        }
                    ]
                },
                {
                    "name": "State 2 Australia",
                    "id": "ausState2",
                    "cities": [
                        {
                            "name": "City 7",
                            "id": "ausState2City7",
                            "area": "12345 sqkm"
                        },
                        {
                            "name": "City 8",
                            "id": "ausState2City8",
                            "area": "12345 sqkm"
                        }
                    ]
                }
            ]
        }
    ]
};



$.each(myJson.country, function (index, value) {
    var country_id;
    var state_id;
    var city_id;
        
        $("#country").append('<option rel="' + index + '" value="'+value.id+'">'+value.name+'</option>');
        
        $("#country").change(function () {
            $("#state, #city").find("option:gt(0)").remove();
            $("#state").find("option:first").text("Loading...");
            
            country_id = $(this).find('option:selected').attr('rel');
            console.log("Country INDEX : " + country_id);
            
            $.each(myJson.country[country_id].states, function (index1, value1) {
                $("#state").find("option:first").text("Choisir");
                $("#state").append('<option rel="' + index1 + '" value="'+value1.id+'">'+value1.name+'</option>');
            });
            
        });
    
        
        $("#state").change(function () {
            $("#city").find("option:gt(0)").remove();
            $("#city").find("option:first").text("Loading...");
            
            state_id = $(this).find('option:selected').attr('rel');
            console.log("State INDEX : " + state_id);
                        
            $.each(myJson.country[country_id].states[state_id].cities, function (index2, value2) {
                $("#city").find("option:first").text("");
                $("#city").append('<option rel="' + index2 + '" value="'+value2.id+'">'+value2.name+'</option>');
            });
            
                   
        });     
    
});