export function isFieldVisibleForObject(fieldName, quote, conn, objectName) {
    if (objectName === 'Quote__c' && fieldName === 'SBQQ__EndDate__c') {
        if (!quote.Partial_Year_Deal__c) {
            return false;
        }
    }
    if (objectName === 'Quote__c' && fieldName === 'SBQQ__SubscriptionTerm__c') {
        if (quote.Partial_Year_Deal__c) {
            return false;
        }
    }
    if (objectName === 'Quote__c' && fieldName === 'DataCenterLocation__c') {
        if (!quote.IsOnePricePriceBook__c) {
            return false;
        }
    }
};
export function isFieldEditableForObject(fieldName, quote, conn, objectName) {
    if (objectName === 'Quote__c' && fieldName == 'DataCenterLocation__c' && quote.SBQQ__Type__c == 'Quote' &&
        quote.IsOnePricePriceBook__c) {
        return true;
    } else if (objectName === 'Quote__c' && fieldName == 'DataCenterLocation__c' && quote.SBQQ__Type__c != 'Quote' &&
        quote.IsOnePricePriceBook__c) {
        return false;
    }
};

//The calculator calls this method before calculation begins, but after formula fields have been evaluated.
export function onBeforeCalculate(quote, lineModels, conn) {

    // Partial Year Deal
    var Difference_In_Days;
    if (quote.record["Partial_Year_Deal__c"] || quote.record["SBQQ__Type__c"] == 'Amendment') {
        if (lineModels != null) {
            var sd = quote.record["SBQQ__StartDate__c"];
            var ed = quote.record["SBQQ__EndDate__c"];
            var date1 = new Date(sd);
            var date2 = new Date(ed);
            // To calculate the time difference of two dates
            var Difference_In_Time = date2.getTime() - date1.getTime();

            // To calculate the no. of days between two dates
            Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
            if (sd == null || ed == null) {
                Difference_In_Days = null;
            }
        }
    }
    var promoCount = 0;
    var startDate = quote.record["SBQQ__StartDate__c"];
    var quoteStartDate = new Date(startDate);
    var quoteType = quote.record["SBQQ__Type__c"];
    var checkADVORULT;
    //alert('onBeforeCalculate');
    lineModels.forEach(function(line) {
        if (line.record["SBQQ__SegmentIndex__c"] != null) {
            line.record["Subscription_Term_days__c"] = Difference_In_Days + 1;
        }

        if (line.record["SBQQ__ProductCode__c"] != null) {
            line.record["ProductCodeTest__c"] = line.record["SBQQ__ProductCode__c"];
        }
        //Set start date on quote line to null in amendments if start date is less than quote start date. Ensures terms 
        //is not incorrectly extended.
        if(quoteType == 'Amendment') {
            if (line.record["SBQQ__StartDate__c"] != null) {
                var date3 = new Date(line.record["SBQQ__StartDate__c"]);
                if(date3 < quoteStartDate) {
                    line.record["SBQQ__StartDate__c"] = null;
                }
            }
        }

        // InsightConnect Partnership PROMO-IVMCOMP
        if (line.record["Associated_Product__c"] == 'InsightVM Competitive Displacement Promotion') {
            promoCount = promoCount + 1;

            // Apply Promotion Term
            if (line.record["SBQQ__SegmentIndex__c"] != null)
                line.record["PromotionTerm__c"] = line.record["SubscriptionTermR7__c"] - line.record["SBQQ__DefaultSubscriptionTerm__c"];

            // Apply PSIVMDEPQS Promo Discount - PROMO-IVMCOMP
            if (line.record["SBQQ__ProductCode__c"] == 'PSIVMDEPQS')
                line.record["SBQQ__Discount__c"] = line.record["PromoDiscount__c"];

            // Apply IVM Promo Discount - PROMO-IVMCOMP
            if (line.record["SBQQ__ProductCode__c"] == 'IVM-SUBSCRIPTION' && line.record["SBQQ__SegmentIndex__c"] == 2)
                line.record["SBQQ__Discount__c"] = line.record["PromoDiscount__c"];
        }
        
        if (line.record["SBQQ__ProductCode__c"] == 'IDR-ADV-SUB' || line.record["SBQQ__ProductCode__c"] == 'IDR-ULT-SUB') {
            checkADVORULT = line.record["SBQQ__ProductCode__c"];
        }
         //update the SBQQ__OptionDiscount__c to 0 and then in next condition update it to 100 based on condition.
		if (line.record["SBQQ__ProductCode__c"] == 'PSIDRDEP_SM' || line.record["SBQQ__ProductCode__c"] == 'PSIDRDEP_MED') {
            line.record["SBQQ__OptionDiscount__c"] = 0;
        }

        // Autopopulate the Data_Retention_Length__c based on the Product Codes
        if (line.record["SBQQ__ProductCode__c"] == 'IDR-ADV-SUB' || line.record["SBQQ__ProductCode__c"] == 'IDR-ULT-SUB' ||
            line.record["SBQQ__ProductCode__c"] == 'THRTCMPLT-ADV-SUB' || line.record["SBQQ__ProductCode__c"] == 'THRTCMPLT-ULT-SUB' ||
            line.record["SBQQ__ProductCode__c"] == 'IDR-ESS-SUB' || line.record["SBQQ__ProductCode__c"] == 'IONE-PACKAGE-SUB' ||
            line.record["SBQQ__ProductCode__c"] == 'MDR-EL-SUB' || line.record["SBQQ__ProductCode__c"] == 'MDR-ESS-SUB' ||
            line.record["SBQQ__ProductCode__c"] == 'MTC-ESS-SUB' || line.record["SBQQ__ProductCode__c"] == 'MTC-ADV-SUB' ) {

            line.record["Data_Retention_Length__c"] = '395 Days';
        }       

        if (line.record["SBQQ__ProductCode__c"] == 'ICN-INS-SUB' || line.record["SBQQ__ProductCode__c"] == 'ICN-PRO-SUB') {
            line.record["SBQQ__PriorQuantity__c"] = 0;
            line.record["SBQQ__Quantity__c"] = 1;
            line.record["SBQQ__ListPrice__c"] = 0;
            line.record["SBQQ__SpecialPriceType__c"] = 'Custom';
        }

		if ((line.record["SBQQ__PriorQuantity__c"] == null || line.record["SBQQ__PriorQuantity__c"] == 0) && 
			(line.record["TrueUpEligible__c"] || line.record["SBQQ__ProductCode__c"] == 'ICS-SUB' || line.record["SBQQ__ProductCode__c"] == 'RSKCMPLT-SUB' || 
            line.record["SBQQ__ProductCode__c"] == 'CRC-ESS-SUB' || line.record["SBQQ__ProductCode__c"] == 'CRC-ADV-SUB')) {
			if (!quote.record["TrueUpSchedule__c"]) {
				quote.record["TrueUpSchedule__c"] = 'Quarterly';
			}
			if (!quote.record["DeploymentType__c"]) {
				quote.record["DeploymentType__c"] = 'SAAS';
			}			
            if(line.record["SBQQ__ProductCode__c"] == 'ICS-SUB' || line.record["SBQQ__ProductCode__c"] == 'RSKCMPLT-SUB') {
			    line.record["SBQQ__TaxCode__c"] = (line.record["DeploymentType__c"] == 'On-Prem') ? 'DC010500':'SW052000' ;
            }
		}
    });

    priceCalculationDataRetention(lineModels, conn);
    
    //Invoke IDREAUPricing method to apply 100% discount to the Deployment Services. 
    if(checkADVORULT !== null) IDREAUPricing(lineModels, conn, checkADVORULT);

    quote.record["Subscription_Term_days__c"] = Difference_In_Days + 1;

    // Update IsPromo checkbox on Quote
    if (promoCount > 0)
        quote.record["IsPromoBundle__c"] = true;
    else
        quote.record["IsPromoBundle__c"] = false;

    //call calculatePromoDiscount method
    calculatePromoDiscount(quote, lineModels, conn);

    //call calculatePartnerDiscount method
    calculatePartnerDiscount(quote, lineModels, conn);
    
    return Promise.resolve();
};

//The calculator calls this method after it evaluates price rules.

export function onAfterPriceRules(quote, lineModels, conn) {

    //call calculateITS method
    calculateITS(quote, lineModels, conn);
   
    //call calculatePartnerDiscount method
    calculatePartnerDiscount(quote, lineModels, conn);
  	
    return Promise.resolve();
};

//The calculator calls this method after it completes a calculation, but before re-evaluating formula fields.
export function onAfterCalculate(quote, lineModels, conn) {

    //call calculateITS method
    calculateITS(quote, lineModels, conn);

    //call calculatePromoDiscount method
    calculatePromoDiscount(quote, lineModels, conn);

    //call processTrueUpNotice method
    processTrueUpNotice(quote, lineModels, conn);

    return Promise.resolve();
};

function IDREAUPricing(lineModels, conn, checkADVORULT){
	if (lineModels != null) {
        lineModels.forEach(function (line) {
			console.log('*$...IDREAUPricing method...'+line.record["SBQQ__ProductCode__c"]);
			//Add the 100% option discount to the deployment services based on the parent product
			if ((line.record["SBQQ__ProductCode__c"] == 'PSIDRDEP_SM' && checkADVORULT == 'IDR-ADV-SUB') || (line.record["SBQQ__ProductCode__c"] == 'PSIDRDEP_MED' && checkADVORULT == 'IDR-ULT-SUB')) {
				line.record["SBQQ__OptionDiscount__c"] = 100;
			}
		});
	}
}

//calculate the ITS value for ICON promo pricing based on the parent products price
function calculateITS(quote, lineModels, conn) {
    let insightTotalSpend = 0;
    let fullTermInsightTotalSpend = 0;
    let checkICONPromoExist = false;
    var ICONPromoOfferings = ['MAS-SUB', 'IAS-SUB', 'IDR-ADV-SUB', 'IDR-ESS-SUB', 'IDR-SUB', 'IVM-SUB', 'MVM-SUB', 'MDR-EL-SUB', 'MDR-ESS-SUB'];

    var productCodesList = [];
    if (lineModels != null) {
        lineModels.forEach(function(line) {
            if (line.record['SBQQ__ProductCode__c'] && line.record['SBQQ__SubscriptionPricing__c'] && productCodesList.indexOf(line.record["SBQQ__ProductCode__c"]) == -1) {
                productCodesList.push(line.record['SBQQ__ProductCode__c']);
            }
            if (ICONPromoOfferings.indexOf(line.record["SBQQ__ProductCode__c"]) !== -1) {
                let PromoAmount = (line.record["PromotionalAmount__c"] > 0) ? line.record["PromotionalAmount__c"] : 0;
                let regularTotal = (line.record["SBQQ__RegularTotal__c"] > 0) ? line.record["SBQQ__RegularTotal__c"] + PromoAmount : 0;
                let prorateMultiplier=(quote.record["ContractSubscriptionTerm__c"]>12)? line.record["MYProrateMultiplier__c"] : line.record["SBQQ__ProrateMultiplier__c"];
                let fullTermRgularTotal=(line.record["SBQQ__RegularTotal__c"]>0)? (line.record["SBQQ__RegularTotal__c"]+PromoAmount)/prorateMultiplier : 0;
                insightTotalSpend = insightTotalSpend + regularTotal + line.record["UpgradedSubscriptionRegularTotal__c"];
                fullTermInsightTotalSpend = fullTermInsightTotalSpend + fullTermRgularTotal + line.record["UpgradedSubscriptionRegularTotal__c"];;
            }
            if (line.record['SBQQ__ProductCode__c'] == 'ICN-INS-SUB' || line.record['SBQQ__ProductCode__c'] == 'ICN-PRO-SUB') {
                checkICONPromoExist = true;
            }
        });
        console.log('*$...insightTotalSpend...' + insightTotalSpend);
        console.log('*$...fullTermInsightTotalSpend...' + fullTermInsightTotalSpend);
        console.log('*$...checkICONPromoExist...' + checkICONPromoExist);
    }
    //call the calculateICONPromoPricing function if promo product exist
    if (checkICONPromoExist) {
        console.log('*$...checkICONPromoExist...' + checkICONPromoExist);
        calculateICONPromoPricing(quote, lineModels, fullTermInsightTotalSpend, conn);
        quote.record["InsightTotalSpend__c"] = insightTotalSpend;
    } else {
        quote.record["InsightTotalSpend__c"] = 0;
    }
    if (productCodesList.length) {
        quote.record["SubscriptionProductCodes__c"] = productCodesList.toString();
    }
};

//calculate the list price of the ICON promo based on the aggrigated insightTotalSpend of parent products
function calculateICONPromoPricing(quote, lineModels, insightTotalSpend, conn) {
    console.log('*$...calculateICONPromoPricing Method Executed...');
    lineModels.forEach(function(line) {
        if (line.record["SBQQ__ProductCode__c"] == 'ICN-INS-SUB' || line.record["SBQQ__ProductCode__c"] == 'ICN-PRO-SUB') {
            //let numOfYrs = quote.record["SubscriptionTermR7__c"] / 12;
			let numOfYrs=quote.record["ContractSubscriptionTerm__c"]/12;
			if(numOfYrs < 1) numOfYrs=1;
            let itsPercent = ((line.record["SBQQ__ProductCode__c"] == 'ICN-INS-SUB') ? ((insightTotalSpend / 100) * 20) : ((insightTotalSpend / 100) * 40));
            console.log('*$...itsPercent ...' + itsPercent);
            let annualITSPercent = (itsPercent >= 1) ? (itsPercent - line.record["UpgradedSubscriptionRegularTotal__c"]) / numOfYrs : 0;
            let annualITSPercentRounded = (annualITSPercent >= 1) ? annualITSPercent : 0;
            //let proratedITSPercent=(itsPercent>0)? (itsPercent-line.record["UpgradedSubscriptionRegularTotal__c"])*line.record["SBQQ__ProrateMultiplier__c"]: 0;
            let proratedITSPercent = (itsPercent >= 1) ? annualITSPercent * line.record["SBQQ__ProrateMultiplier__c"] : 0;
            let OverwriteSpecialPrice = (line.record["OverwriteSpecialPrice__c"] >= 1) ? line.record["OverwriteSpecialPrice__c"] / numOfYrs : annualITSPercent;

            annualITSPercent = (annualITSPercent >= 1) ? annualITSPercent : 0;
            proratedITSPercent = (proratedITSPercent >= 1) ? proratedITSPercent : 0;
            OverwriteSpecialPrice = (OverwriteSpecialPrice >= 1) ? OverwriteSpecialPrice : 0;

            console.log('*$...annualITSPercent ...' + annualITSPercent);
            console.log('*$...proratedITSPercent...' + proratedITSPercent);
            console.log('*$...OverwriteSpecialPrice...' + OverwriteSpecialPrice);

            line.record["SBQQ__PriorQuantity__c"] = 0;
            line.record["SBQQ__ListPrice__c"] = annualITSPercent;
            line.record["SBQQ__OriginalPrice__c"] = annualITSPercent;
            line.record["SBQQ__ProratedPrice__c"] = proratedITSPercent;
            line.record["SBQQ__ProratedListPrice__c"] = proratedITSPercent;
            line.record["SBQQ__SpecialPrice__c"] = OverwriteSpecialPrice;
            line.record["SBQQ__SpecialPriceType__c"] = 'Custom';
            line.record["SBQQ__Optional__c"] = false;
            if (OverwriteSpecialPrice < 1) {
                line.record["SBQQ__CustomerPrice__c"] = 0;
                line.record["SBQQ__PartnerPrice__c"] = 0;
                line.record["SBQQ__NetPrice__c"] = 0;
                line.record["SBQQ__NetPrice__c"] = 0;
                line.record["SBQQ__Optional__c"] = true;
            }
        }
    });
};

function priceCalculationDataRetention(lines, conn) {

    var productCodes = [];
    lines.forEach(function(line) {
        if (line.record['SBQQ__ProductCode__c']) {
            productCodes.push(line.record['SBQQ__ProductCode__c']);
        }
        if (line.record['Associated_Product__c']) {
            productCodes.push(line.record['Associated_Product__c']);
        }
    });

    if (productCodes.length) {
        var conditions = {
            ProductCode__c: {
                $in: productCodes
            },
            Active__c: true
        };
        var fields = ['Id', 'ProductCode__c', 'DataRetention__c', 'SBQQ__Value__c'];
        return conn.sobject('SBQQ__LookupData__c').find(conditions, fields).execute(function(err, records) {
            if (err) {
                return Promise.reject(err);
            } else {
                var productRetentionMap = new Map();
                records.forEach(function(record) {
                    let retentionObj = {};
                    if (productRetentionMap.has(record.ProductCode__c)) {
                        retentionObj = productRetentionMap.get(record.ProductCode__c);
                    }
                    retentionObj[record.DataRetention__c] = record.SBQQ__Value__c;
                    productRetentionMap.set(record.ProductCode__c, retentionObj);
                });
                lines.forEach(function(line) {
                    let retentionObj = {};
                    if (line.record['SBQQ__ProductCode__c'] && productRetentionMap.has(line.record['SBQQ__ProductCode__c'])) {
                        retentionObj = productRetentionMap.get(line.record['SBQQ__ProductCode__c']);
                    }
                    if (line.record['Associated_Product__c'] && productRetentionMap.has(line.record['Associated_Product__c'])) {
                        retentionObj = productRetentionMap.get(line.record['Associated_Product__c']);
                    }
                    if (retentionObj.hasOwnProperty(line.record["Data_Retention_Length__c"])) {
                        line.record["SBQQ__ListPrice__c"] = line.record["SBQQ__OriginalPrice__c"] * retentionObj[line.record["Data_Retention_Length__c"]];
                    }
                });
            }
        });
    }
};

function calculatePartnerDiscount(quote, lines, conn) {
    console.log('inside calculatePartnerDiscount method');
	console.log('inside calculatePartnerDiscount method123');
    if((quote.record["SBQQ__Partner__c"] != null && quote.record["SBQQ__Distributor__c"] == null && quote.record["FirstCloned__c"] == false) ||
       (quote.record["SBQQ__Distributor__c"] != null && quote.record["FirstCloned__c"] == false)
        ){
        var dealTypeCount = '';
        var qlDealType='';
        var qlSellingMotion='';
                    
        lines.forEach(function(line) {            
			console.log('*....calculatePartnerDiscount..inside For Loop ...'+line.record["SBQQ__ProductCode__c"]);
            var discount = 0;						
            
            if(line.record["SBQQ__Discount__c"] > 99 || line.record["SBQQ__NonDiscountable__c"] == true){				
                line.record["SBQQ__PartnerDiscount__c"] = 0;
                line.record["SBQQ__DistributorDiscount__c"] = 0;
               // line.record["DealType__c"] = null;				
                line.record["PriceRuleIndentifier__c"] = line.record["PriceRuleIndentifier__c"] + 'CPD-U1,';
            }else {				
                if (quote.record["IsPartnerAdded__c"] || (line.record["DealType__c"] == null && quote.record["DealType__c"] != null)){
                    line.record["DealType__c"] = quote.record["DealType__c"];			
                    line.record["PriceRuleIndentifier__c"] = line.record["PriceRuleIndentifier__c"] + 'CPD-U2,';					
                }
                
                if(quote.record["SBQQ__Type__c"] != 'Quote' && line.record["SBQQ__RenewedSubscription__c"] == null && line.record["SBQQ__UpgradedSubscription__c"] == null && line.record["IncumbentListPrice__c"] == null ){
                    discount = line.record["DynamicPartDistDiscount__c"];						
                    line.record["PriceRuleIndentifier__c"] = line.record["PriceRuleIndentifier__c"] + 'CPD-U3,';						
                }
                else if(line.record["DealType__c"] == 'Standard Transfer'){
                    discount = quote.record["StandardTransferDiscount__c"];
                    line.record["PriceRuleIndentifier__c"] = line.record["PriceRuleIndentifier__c"] + 'CPD-U5,';						
                }	
                else if(line.record["DealType__c"] == 'Deal Registration'&& line.record["ProductType__c"] == 'Software'){
                    discount = quote.record["DealRegistrationDiscount__c"];
                    line.record["PriceRuleIndentifier__c"] = line.record["PriceRuleIndentifier__c"] + 'CPD-U6,';						
                }	
                else if(line.record["DealType__c"] == 'Deal Registration' && line.record["ProductType__c"] == 'Managed Service'){
                    discount = quote.record["ManagedDealRegDiscount__c"];
                    line.record["PriceRuleIndentifier__c"] = line.record["PriceRuleIndentifier__c"] + 'CPD-U7,';						
                }
                else if(line.record["DealType__c"] == 'Co-Sell' && line.record["ProductType__c"] == 'Software'){
                    discount = quote.record["CoSellDiscount__c"];
                    line.record["PriceRuleIndentifier__c"] = line.record["PriceRuleIndentifier__c"] + 'CPD-U8,';						
                }
                else if(line.record["DealType__c"] == 'Co-Sell' && line.record["ProductType__c"] == 'Managed Service'){
                    discount = quote.record["ManagedCoSellDiscount__c"];
                    line.record["PriceRuleIndentifier__c"] = line.record["PriceRuleIndentifier__c"] + 'CPD-U9,';						
                }
                else if(line.record["DealType__c"] == 'MSSP' && (quote.record["SBQQ__Partner__c"] != null && quote.record["SBQQ__Distributor__c"] == null)){
                    discount = line.record["MSSPDiscount__c"];
                    line.record["PriceRuleIndentifier__c"] = line.record["PriceRuleIndentifier__c"] + 'CPD-U10,';						
                }
                else if(line.record["ProductType__c"] != 'Software' && line.record["ProductType__c"] != 'Managed Service' && line.record["DealType__c"] != 'Standard Transfer' && line.record["DealType__c"] != 'Custom'){
                    discount = quote.record["ServicesDiscount__c"];					
                    line.record["PriceRuleIndentifier__c"] = line.record["PriceRuleIndentifier__c"] + 'CPD-U11,';						
                }
                else{
                    discount = 0;
                    line.record["PriceRuleIndentifier__c"] = line.record["PriceRuleIndentifier__c"] + 'CPD-U12,';
                }
                
                if((quote.record["SBQQ__Partner__c"] != null && quote.record["SBQQ__Distributor__c"] == null) ){
                     line.record["SBQQ__PartnerDiscount__c"] = discount;
                    line.record["SBQQ__DistributorDiscount__c"] = 0;
                    line.record["PriceRuleIndentifier__c"] = line.record["PriceRuleIndentifier__c"] + 'CPD-U13,';
                }else if(quote.record["SBQQ__Distributor__c"] != null){
                    line.record["SBQQ__DistributorDiscount__c"] = discount;
                    line.record["SBQQ__PartnerDiscount__c"] = 0;
                    line.record["PriceRuleIndentifier__c"] = line.record["PriceRuleIndentifier__c"] + 'CPD-U14,';
                }
				
				qlDealType = line.record["DealType__c"];	
            }
            if(line.record["SBQQ__NonDiscountable__c"] == true){
                line.record["SBQQ__Discount__c"] = 0;
                line.record["PriceRuleIndentifier__c"] = line.record["PriceRuleIndentifier__c"] + 'CPD-U15,';
            }
	                    
            if(qlSellingMotion =='' && line.record["SellingMotion__c"] != null){
               qlSellingMotion = line.record["SellingMotion__c"];
         }		
	
            //remove Custom Partner Discount when Deal or Partner/Distributor is changed	
            if(quote.record["isPartnerDistributorChanged__c"] == true || quote.record["isDealTypeChanged__c"] == true){
                line.record["CustomPartnerDiscount__c"] = null;
                line.record["PriceRuleIndentifier__c"] = line.record["PriceRuleIndentifier__c"] + 'CPD-U16A,';
            }
            //add custom partner discount as the partner discount on quote line 
            if(quote.record["SBQQ__Partner__c"] != null && quote.record["SBQQ__Distributor__c"] == null && line.record["CustomPartnerDiscount__c"] != null ){
                line.record["SBQQ__PartnerDiscount__c"] = line.record["CustomPartnerDiscount__c"];
                line.record["PriceRuleIndentifier__c"] = line.record["PriceRuleIndentifier__c"] + 'CPD-U16B,';
            }
            //add custom partner discount as the distributor discount on quote line 
            if(quote.record["SBQQ__Distributor__c"] != null && line.record["CustomPartnerDiscount__c"] != null ){
                line.record["SBQQ__DistributorDiscount__c"] = line.record["CustomPartnerDiscount__c"];
                line.record["PriceRuleIndentifier__c"] = line.record["PriceRuleIndentifier__c"] + 'CPD-U16C,';
            }
			
			console.log('inside calculatePartnerDiscount method2 '+qlDealType);
               
            if(!(dealTypeCount.includes('ST')) && line.record["DealType__c"] == 'Standard Transfer')
                dealTypeCount = dealTypeCount + 'ST';
            else if(!(dealTypeCount.includes('DR')) && line.record["DealType__c"] == 'Deal Registration')
                dealTypeCount = dealTypeCount + 'DR';
            else if(!(dealTypeCount.includes('CS')) && line.record["DealType__c"] == 'Co-Sell')
                dealTypeCount = dealTypeCount + 'CS';	
        });
        quote.record["IsPartnerAdded__c"] = false;	
        
		console.log('inside calculatePartnerDiscount method321 '+qlDealType);
        if(dealTypeCount.length > 2 && (!quote.record["isPartnerDistributorChanged__c"] || qlSellingMotion  == 'Cross-sell' || qlSellingMotion == 'Upgrade' || qlSellingMotion == 'Downgrade') && quote.record["DealType__c"] != 'Custom'){
           quote.record["DealType__c"] = 'Custom';	
        }
       else if(dealTypeCount.length > 0 && dealTypeCount.length <=2 && quote.record["DealType__c"] != qlDealType && qlDealType !=null ){
            quote.record["DealType__c"] = qlDealType;
			console.log('Inside If  '+qlDealType);
        }
		console.log('Outside If  '+qlDealType);		
    }
    
    if((quote.record["SBQQ__Partner__c"] == null && quote.record["SBQQ__Distributor__c"] == null)){
        lines.forEach(function(line) {
            line.record["SBQQ__PartnerDiscount__c"] = 0;
            line.record["SBQQ__DistributorDiscount__c"] = 0;
            line.record["DealType__c"] = null;
            line.record["PriceRuleIndentifier__c"] = line.record["PriceRuleIndentifier__c"] + 'CPD-U17,';
        });
    }
	console.log('Outside If1  '+qlDealType);		
};

function calculatePromoDiscount(quote, lineModels, conn) {
    console.log('inside calculatePromoDiscount method');
    quote.record["IsDisApprovalRequired__c"] = false;
    lineModels.forEach(function(line) {
        if (line.record["IsAppForFreePeriods__c"] && !quote.record["IsDisApprovalRequired__c"] && (line.record["TransactionType__c"] == 'New' || line.record["TransactionType__c"] == 'Upsell')) {
            quote.record["IsDisApprovalRequired__c"] = true;
        }
        if (quote.record["SBQQ__SubscriptionTerm__c"] > 12) {
            if (quote.record["SBQQ__Type__c"] == 'Quote') {
                if (line.record["IsAppForFreePeriods__c"]) {
                    line.record["PromotionTerm__c"] = (quote.record["SBQQ__SubscriptionTerm__c"] % 12) == 0 ? 12 : (quote.record["SBQQ__SubscriptionTerm__c"] % 12);
                    var promoDiscount = line.record["PromotionTerm__c"] / quote.record["SBQQ__SubscriptionTerm__c"];
                    line.record["PromotionalDiscount__c"] = promoDiscount * 100;
                    line.record["SBQQ__SpecialPriceType__c"] = 'Custom';
                    line.record["SBQQ__SpecialPrice__c"] = (line.record["SBQQ__ListPrice__c"] - (line.record["SBQQ__ListPrice__c"] * promoDiscount));
                    if (promoDiscount == 1) {
                        line.record["PromoProrateMultiplier__c"] = 1;
                    } else {
                        line.record["PromoProrateMultiplier__c"] = (1 - promoDiscount);
                    }
                } else if (line.record["PromotionalQuantity__c"] != null && line.record["PromotionalQuantity__c"] > 0) {
                    var promoDiscount1 = line.record["PromotionalQuantity__c"] / line.record["SBQQ__Quantity__c"];
                    line.record["PromotionalDiscount__c"] = promoDiscount1 * 100;
                    line.record["SBQQ__SpecialPriceType__c"] = 'Custom';
                    line.record["SBQQ__SpecialPrice__c"] = (line.record["SBQQ__ListPrice__c"] - (line.record["SBQQ__ListPrice__c"] * promoDiscount1));
                    if (promoDiscount1 == 1) {
                        line.record["PromoProrateMultiplier__c"] = 1;
                    } else {
                        line.record["PromoProrateMultiplier__c"] = (1 - promoDiscount1);
                    }
                }
            }
            /*else if (quote.record["SBQQ__Type__c"] == 'Amendment') {
				if (line.record["IsAppForFreePeriods__c"]) {
					var subTerm = line.record["SBQQ__ProrateMultiplier__c"]*12;
					line.record["PromotionTerm__c"] = (subTerm % 12) == 0 ? 12 : (subTerm % 12);
					var promoDiscount = line.record["PromotionTerm__c"] /subTerm;
					line.record["PromotionalDiscount__c"] = promoDiscount*100;
					line.record["SBQQ__SpecialPriceType__c"] = 'Custom';
					line.record["SBQQ__SpecialPrice__c"] = (line.record["SBQQ__ListPrice__c"] - (line.record["SBQQ__ListPrice__c"]* promoDiscount));
					line.record["PromoProrateMultiplier__c"] = 1-promoDiscount;
				}
			}*/
        } else {
            if (quote.record["SBQQ__Type__c"] == 'Quote') {
                if (line.record["IsAppForFreePeriods__c"]) { // || line.record["PromotionalQuantity__c"] > 0 ||  line.record["PromotionalDiscount__c"] > 0) {
                    line.record["PromotionalDiscount__c"] = null;
                    line.record["PromotionTerm__c"] = null;
                    line.record["SBQQ__ProrateMultiplier__c"] = 1;
                    line.record["SBQQ__SpecialPriceType__c"] = '';
                    line.record["SBQQ__SpecialPrice__c"] = (line.record["SBQQ__ListPrice__c"]);
                    line.record["PromoProrateMultiplier__c"] = 1;
               } else if (line.record["PromotionalQuantity__c"] > 0) {
                    var promoDiscount1 = line.record["PromotionalQuantity__c"]/line.record["SBQQ__Quantity__c"];
                    line.record["PromotionalDiscount__c"] = promoDiscount1*100;
                    line.record["SBQQ__SpecialPriceType__c"] = 'Custom';
                    line.record["SBQQ__SpecialPrice__c"] = (line.record["SBQQ__ListPrice__c"] - (line.record["SBQQ__ListPrice__c"]*promoDiscount1)); 
                    if (promoDiscount1 == 1) {
                           line.record["PromoProrateMultiplier__c"] = 1;
                    } else {
                           line.record["PromoProrateMultiplier__c"] = (1- promoDiscount1);
                    }	
               }
            }
        }
        if (quote.record["SBQQ__Type__c"] == 'Amendment') {
            if (line.record["IsAppForFreePeriods__c"]) {
                console.log(line.record["SBQQ__ProrateMultiplier__c"]);
                var subTerm = line.record["SBQQ__ProrateMultiplier__c"] * 12;
                var newSaleTerm = line.record["UpgradedSubscriptionProrateMultiplier__c"] * 12;
                var newSTerm = line.record["NewSalePromotionTerm__c"];
                console.log('subTerm' + subTerm);
                console.log('newSaleTerm' + newSaleTerm);
                console.log('newSalePromoTerm' + newSTerm);
                quote.record["SBQQ__SubscriptionTerm__c"] = subTerm;
                if ((subTerm + newSTerm) > newSaleTerm) {
                    line.record["PromotionTerm__c"] = (subTerm % 12) == 0 ? 12 : (subTerm % 12);
                    var promoDiscount = line.record["PromotionTerm__c"] / subTerm;
                    line.record["PromotionalDiscount__c"] = promoDiscount * 100;
                    line.record["SBQQ__SpecialPriceType__c"] = 'Custom';
                    line.record["SBQQ__SpecialPrice__c"] = (line.record["SBQQ__ListPrice__c"] - (line.record["SBQQ__ListPrice__c"] * promoDiscount));
                    line.record["PromoProrateMultiplier__c"] = 1 - promoDiscount;
                } else {
                    line.record["PromotionalDiscount__c"] = null;
                    line.record["PromotionTerm__c"] = null;
                    line.record["PromoProrateMultiplier__c"] = 1;
                    line.record["SBQQ__SpecialPriceType__c"] = '';
                    line.record["SBQQ__SpecialPrice__c"] = (line.record["SBQQ__ListPrice__c"]);
                }
            }
        }
    });
}

function processTrueUpNotice(quote, lineModels, conn) {
    var productIds = [];
    var accountIds = [];
    lineModels.forEach(function(line) {
        if (line.record["SBQQ__BlockPrice__c"] != null && line.record["TransactionType__c"] == 'Upsell') {
            productIds.push(line.record['SBQQ__Product__c']);
            accountIds.push(quote.record['SBQQ__Account__c']);
            quote.record["TrueUpListPrice__c"] = line.record["RegularTotalTotalOwnership__c"] != null && line.record["RegularTotalTotalOwnership__c"] > 0 ? line.record["RegularTotalTotalOwnership__c"] : 0;
            quote.record["TrueUpCustomDiscount__c"] = line.record["SBQQ__Discount__c"] != null && line.record["SBQQ__Discount__c"] > 0 ? line.record["SBQQ__Discount__c"] : 0;
            quote.record["TrueUpCustomDiscAmt__c"] = line.record["AdditionalDiscountTotalOwnership__c"] != null && line.record["AdditionalDiscountTotalOwnership__c"] > 0 ? line.record["AdditionalDiscountTotalOwnership__c"] : 0;
            quote.record["TrueUpPartnerDiscount__c"] = line.record["PartDistDiscount__c"] != null && line.record["PartDistDiscount__c"] > 0 ? line.record["PartDistDiscount__c"] : 0;
            quote.record["TrueUpPartnerDiscAmt__c"] = line.record["PartnerDiscountTotalOwnership__c"] != null && line.record["PartnerDiscountTotalOwnership__c"] > 0 ? line.record["PartnerDiscountTotalOwnership__c"] : 0;
            quote.record["TrueUpOrderTotal__c"] = line.record["SBQQ__NetTotal__c"] != null && line.record["SBQQ__NetTotal__c"] > 0 ? line.record["SBQQ__NetTotal__c"] : 0;
            quote.record["TrueUpTier__c"] = line.record["TierQuantity__c"] != null && line.record["TierQuantity__c"] > 0 ? line.record["TierQuantity__c"] : 0;
            quote.record["TrueUpAnnualPrice__c"] = line.record["TrueUpListPrice__c"];
        }
    });
    if (productIds.length) {
        var codeList = "('" + productIds.join("', '") + "')";
        var accList = "('" + accountIds.join("', '") + "')";
        /*
         * conn.query() returns a Promise that resolves when the query completes.
         */
        return conn.query('SELECT Id, SBQQ__Discount__c, SBQQ__Product__c FROM SBQQ__ContractedPrice__c WHERE SBQQ__Product__c IN ' + codeList + ' and  SBQQ__Account__c IN ' + accList)
            .then(function(results) {
                /*
                 * conn.query()'s Promise resolves to an object with three attributes:
                 * - totalSize: an integer indicating how many records were returned
                 * - done: a boolean indicating whether the query has completed
                 * - records: a list of all records returned
                 */
                if (results.totalSize) {
                    var valuesByCategory = {};
                    results.records.forEach(function(record) {
                        quote.record["IsContractedDiscount__c"] = results.totalSize > 0 ? true : false;
                        quote.record["Contract_Discount__c"] = record.SBQQ__Discount__c;
                    });
                } else {
                    quote.record["IsContractedDiscount__c"] = false;
                    quote.record["Contract_Discount__c"] = 0;
                }
            });
        return Promise.resolve();
    }

}
