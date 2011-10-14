# Eventful code comes here
# Program state should not be manipulated outside events files

bimserverImportDialogClearMessages = () ->
  ($ '#bimserver-import-message-info').html ''
  ($ '#bimserver-import-message-error').html ''
  ($ '.error').removeClass 'error'

bimserverImportDialogShow = () ->
  bimserverImportDialogShowTab1()
  ($ '#dialog-background').show()

bimserverImportDialogShowTab1 = () ->
  bimserverImportDialogClearMessages()
  $stepElements = $ '#dialog-bimserver-import .dialog-step'
  ($ $stepElements.get(0)).addClass 'dialog-step-active'
  ($ $stepElements.get(1)).removeClass 'dialog-step-active'
  ($ '#dialog-tab-bimserver1').show()
  ($ '#dialog-tab-bimserver2').hide()

bimserverImportDialogShowTab2 = () ->
  bimserverImportDialogClearMessages()
  $stepElements = $ '#dialog-bimserver-import .dialog-step'
  ($ $stepElements.get(0)).removeClass 'dialog-step-active'
  ($ $stepElements.get(1)).addClass 'dialog-step-active'
  ($ '#dialog-tab-bimserver1').hide()
  ($ '#dialog-tab-bimserver2').show()

bimserverImportDialogToggleTab2 = () ->
  # TODO: Test whether server bimserver connection is active

bimserverImportDialogLogin = () ->
  # Clear the message fields
  bimserverImportDialogClearMessages()

  url = ($ '#bimserver-import-url').val()
  user = ($ '#bimserver-import-username').val()
  pwd = ($ '#bimserver-import-password').val()

  # Validate inputs
  valid = true
  if url.length < 1
    ($ '#bimserver-import-url').addClass 'error'
    valid = false
  if user.length < 1
    ($ '#bimserver-import-username').addClass 'error'
    valid = false
  if pwd.length < 1
    ($ '#bimserver-import-password').addClass 'error'
    valid = false
  
  if not valid
    ($ '#bimserver-import-message-error').html 'Some fields are incorrect'
    return false

  # Disable the login button and all form elements once the login button has been hit
  ($ '#dialog-tab-bimserver1 input, #dialog-tab-bimserver1 button').attr 'disabled', 'disabled'

  # NOTE: Writing a correct url validation regex (with no false positives or false negatives) is close to impossible.
  # Instead we are relying on the browsers validation on the field itself and then simply try to use the url.
  # If the server answers the url is clearly correct.

  # Ensure root url ends with /
  if url[url.length - 1] != '/'
    url += '/'
  
  # TODO: Ping the url to make sure it's correct? (Is it necessary?)

  # Call the REST api
  # TODO: Would be nice to find a more secure way to login (without using clear text)
  ($ '#bimserver-import-message-info').html 'Sending login request...'
  ($.get url + 'rest/login', 'username=' + (encodeURIComponent user) + '&password=' + (encodeURIComponent pwd))
    .done (data, textStatus, jqXHR) -> 
      ($ '#bimserver-import-message-info').html 'Login request succeeded'
    .fail (jqXHR, textStatus, errorThrown) -> 
      ($ '#bimserver-import-message-info').html ''
      ($ '#bimserver-import-message-error').html 'Login request failed'
    .always (jqXHR, textStatus, errorThrown) -> 
      ($ '#dialog-tab-bimserver1 input, #dialog-tab-bimserver1 button').removeAttr 'disabled'
      bimserverImportDialogShowTab2()

  pwd = null
  return true

