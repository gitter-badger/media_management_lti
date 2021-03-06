angular.module('media_manager')
.service('Droplet', ['$timeout', '$log', '$q', 'AppConfig', function($timeout, $log, $q, AppConfig){
  var ds = this;

  ds.interface = null;
  
  ds.allowedExtensions = ['png', 'jpg', 'jpeg', 'gif'];
  
  ds.maximumValidFiles = 10;

  ds.requestHeaders = {
    'Accept': 'application/json',
    'Authorization': AppConfig.authorization_header
  };
  
  // Returns the image upload URL.
  ds.getUploadUrl = function() {
      var request_url = ":base_url/courses/:course_id/images";
      request_url = request_url.replace(':base_url', AppConfig.media_management_api_url);
      request_url = request_url.replace(':course_id', AppConfig.course_id);
      return request_url;
  };

  ds.onReady = function() {
    ds.interface.allowedExtensions(ds.allowedExtensions);
    ds.interface.setRequestUrl(ds.getUploadUrl());
    ds.interface.setRequestHeaders(ds.requestHeaders);
    ds.interface.defineHTTPSuccess([/2.{2}/]);
    ds.interface.useArray(false);
    ds.interface.setPostData({"title": "Untitled"})
    $log.debug("Ready: droplet ready", ds.interface);
  };

  ds.onSuccess = function(callback) {
    return function(event, response, files) {
      $log.debug("Success: droplet uploaded file: ", files, response);
      if (callback) {
        callback(event, response, files);
      }
    };
  };
  
  ds.onError = function(callback) {
    return function(event, response) {
      $log.debug("Error: droplet uploaded file: ", response);
      if(callback) {
        callback(event, response);
      }
    };
  };

  ds.onFileAdded = function(success, error) {
    return function(event, model) {
      $log.debug("Notification: droplet file added", model);
      var total_valid = ds.getTotalValid();
      var is_valid_type = (model.type == ds.interface.FILE_TYPES.VALID)
      var is_valid_total = (total_valid <= ds.maximumValidFiles);
      var msg = "";
  
      if (is_valid_type && is_valid_total) {
        success && success(event, model);
      } else {
        $log.debug("Notification: file added is invalid; NOT uploading with extension: ", model.extension);
        //alert("Error: '" + model.file.name +"' is not valid for upload. Cannot upload file with extension '" + model.extension + "'. File must be one of: " + Droplet.allowedExtensions.join(", "));
        model.deleteFile();
        if (!is_valid_total) {
          msg = "Too many images to upload. You can upload " + ds.maximumValidFiles + " at a time.";
        } else if (!is_valid_type) {
          msg = "Invalid image: '" + model.file.name +"'. Cannot upload file with extension '" + model.extension + "'. File extension must be one of: " + ds.allowedExtensions.join(", ")
        }
        error && error(event, model, msg);
      }
    };
  };
  
  ds.onFileDeleted = function(callback) {
    return function(event, model) {
      $log.debug("Notification: droplet file deleted", model);
      if(callback) {
        callback(event, model);
      }
    };
  };

  ds.getTotalValid = function() {
    return ds.interface ? ds.interface.getFiles(ds.interface.FILE_TYPES.VALID).length : 0;
  };

  ds.uploadFiles = function() {
    if (ds.interface) {
      $log.debug("Notification: uploadFiles()")
      ds.interface.uploadFiles();
    } else {
      $log.error("Error: droplet interface not available to upload files");
    }
  };
}]);
