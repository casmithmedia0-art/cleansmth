(function () {
  function initializeAdmin() {
  'use strict';

  var config = window.CLEANSMITH_SUPABASE_CONFIG || {};
  var loginPanel = document.getElementById('loginPanel');
  var dashboard = document.getElementById('dashboard');
  var loginStatus = document.getElementById('loginStatus');
  var dashboardStatus = document.getElementById('dashboardStatus');
  var client;
  var sitePages = [];

  function message(node, text, error) {
    node.textContent = text || '';
    node.classList.toggle('error', Boolean(error));
  }

  function configured() {
    return config.url && config.anonKey &&
      config.url.indexOf('YOUR_PROJECT_ID') === -1 &&
      config.anonKey.indexOf('YOUR_SUPABASE_') === -1 &&
      window.supabase && window.supabase.createClient;
  }

  function call(result) {
    return result.then(function (response) {
      if (response.error) throw response.error;
      return response.data;
    });
  }

  function rows(table, column) {
    return call(client.from(table).select('*').order(column, { ascending: true }));
  }

  function formValues(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function lines(value) {
    return String(value || '').split(/\r?\n/).map(function (line) {
      return line.trim();
    }).filter(Boolean);
  }

  function number(value) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new Error('Enter a valid number.');
    return parsed;
  }

  function save(table, id, values) {
    var query = table === 'site_pages'
      ? client.from(table).update(values).eq('slug', values.slug)
      : id
        ? client.from(table).update(values).eq('id', id)
        : client.from(table).insert(values);
    return call(query.select().single());
  }

  function remove(table, id) {
    return call(client.from(table).delete().eq('id', id));
  }

  function make(tag, text, className) {
    var node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function actionButton(label, callback, danger) {
    var button = make('button', label, 'btn ' + (danger ? 'danger' : 'secondary'));
    button.type = 'button';
    button.addEventListener('click', callback);
    return button;
  }

  function card(list, title, detail, edit, del, media) {
    var item = make('article', undefined, 'item');
    if (media) item.appendChild(media);
    var main = make('div', undefined, 'item-main');
    main.appendChild(make('div', title, 'item-title'));
    main.appendChild(make('small', detail || '', 'muted'));
    item.appendChild(main);
    var actions = make('div', undefined, 'item-actions');
    actions.appendChild(actionButton('Edit', edit, false));
    actions.appendChild(actionButton('Delete', del, true));
    item.appendChild(actions);
    list.appendChild(item);
  }

  function resetForm(form) {
    form.reset();
    form.elements.id.value = '';
  }

  function editForm(form, record, transforms) {
    Object.keys(record).forEach(function (key) {
      var control = form.elements.namedItem(key);
      if (!control) return;
      var value = record[key];
      if (transforms && transforms[key]) value = transforms[key](value);
      control.value = value == null ? '' : value;
    });
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updateVehiclePriceFields(form) {
    var isCarWash = form.elements.service_slug.value === 'car-wash';
    form.querySelector('[data-car-price-fields]').hidden = !isCarWash;
    ['hatch', 'sedan', 'suv', 'luxury', 'minibus'].forEach(function (vehicle) {
      form.elements['price_' + vehicle].required = isCarWash;
    });
  }

  function isSafeImageUrl(value) {
    var url = String(value || '');
    return /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url);
  }

  function isSafeMediaUrl(value) {
    var url = String(value || '');
    return /^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url);
  }

  function renderPackages(data) {
    var list = document.getElementById('packageList');
    var serviceNames = {
      'car-wash': 'Car wash',
      'home-cleaning': 'Home cleaning',
      gardening: 'Gardening'
    };
    list.replaceChildren();
    data.forEach(function (pkg) {
      card(list, pkg.name + ' — R' + Number(pkg.starting_price).toLocaleString('en-ZA'),
        (serviceNames[pkg.service_slug] || 'Car wash') + ' · ' +
        (pkg.is_active ? 'Visible' : 'Hidden') + ' · ' + pkg.slug,
        function () {
          var form = document.getElementById('packageForm');
          editForm(form, pkg, {
            features: function (items) { return (items || []).join('\n'); },
            is_active: String,
            sort_order: String
          });
          updateVehiclePriceFields(form);
          ['hatch', 'sedan', 'suv', 'luxury', 'minibus'].forEach(function (vehicle) {
            form.elements['price_' + vehicle].value = pkg.vehicle_prices && pkg.vehicle_prices[vehicle] != null
              ? pkg.vehicle_prices[vehicle]
              : '';
          });
        },
        function () {
          if (!window.confirm('Delete this package?')) return;
          remove('packages', pkg.id).then(function () {
            return refreshThenMessage('Package deleted.');
          }).catch(showError);
        });
    });
  }

  function editSitePage(form, page) {
    form.elements.hero_image_file.value = '';
    form.elements.current_hero_image_url.value = page.hero_image_url || '';
    editForm(form, page);
    renderHeroSlideEditors(form, page.hero_slides || []);
  }

  function heroSlideField(slide, labelText, name, type, placeholder) {
    var label = make('label', labelText);
    var input = document.createElement('input');
    input.type = type;
    input.dataset.slideField = name;
    input.value = type === 'file' ? '' : (slide[name] || '');
    if (placeholder) input.placeholder = placeholder;
    if (type === 'file' && name === 'image_file') input.accept = 'image/jpeg,image/png,image/webp,image/gif';
    if (type === 'file' && name === 'video_file') input.accept = 'video/mp4,video/webm';
    label.appendChild(input);
    return label;
  }

  function appendHeroSlideEditor(list, slide, index) {
    var editor = make('fieldset', undefined, 'hero-slide-editor');
    editor.dataset.heroSlide = '';
    var legend = make('legend', 'Slide ' + (index + 1));
    var fields = make('div', undefined, 'hero-slide-fields');
    fields.appendChild(heroSlideField(slide, 'Title', 'title', 'text'));
    fields.appendChild(heroSlideField(slide, 'Subtitle', 'subtitle', 'text'));
    fields.appendChild(heroSlideField(slide, 'Image URL or video poster', 'image_url', 'text', 'https://... or /image.jpg'));
    fields.appendChild(heroSlideField(slide, 'Or upload an image', 'image_file', 'file'));
    fields.appendChild(heroSlideField(slide, 'Short video URL (MP4 or WebM)', 'video_url', 'text', 'https://... or /clip.mp4'));
    fields.appendChild(heroSlideField(slide, 'Or upload a short video (max 25 MB)', 'video_file', 'file'));
    fields.appendChild(heroSlideField(slide, 'CTA text', 'cta_text', 'text'));
    fields.appendChild(heroSlideField(slide, 'CTA URL', 'cta_url', 'text'));
    editor.appendChild(legend);
    editor.appendChild(fields);
    editor.appendChild(actionButton('Remove slide', function () {
      editor.remove();
      updateHeroSlideNumbers(list);
    }, true));
    var imageUrl = fields.querySelector('[data-slide-field="image_url"]');
    var imageFile = fields.querySelector('[data-slide-field="image_file"]');
    var videoUrl = fields.querySelector('[data-slide-field="video_url"]');
    var videoFile = fields.querySelector('[data-slide-field="video_file"]');
    imageUrl.addEventListener('input', function () {
      if (imageUrl.value) imageFile.value = '';
    });
    imageFile.addEventListener('change', function () {
      if (imageFile.files && imageFile.files.length) {
        imageUrl.value = '';
        videoUrl.value = '';
        videoFile.value = '';
      }
    });
    videoUrl.addEventListener('input', function () {
      if (videoUrl.value) videoFile.value = '';
    });
    videoFile.addEventListener('change', function () {
      if (videoFile.files && videoFile.files.length) videoUrl.value = '';
    });
    list.appendChild(editor);
  }

  function renderHeroSlideEditors(form, slides) {
    var list = form.querySelector('#heroSlides');
    list.replaceChildren();
    slides.filter(function (slide) { return slide && typeof slide === 'object'; })
      .forEach(function (slide, index) {
      appendHeroSlideEditor(list, slide, index);
    });
    updateHeroSlideNumbers(list);
  }

  function updateHeroSlideNumbers(list) {
    list.querySelectorAll('[data-hero-slide]').forEach(function (editor, index) {
      editor.querySelector('legend').textContent = 'Slide ' + (index + 1);
    });
  }

  function heroSlideValues(editor) {
    var values = {};
    ['title', 'subtitle', 'image_url', 'video_url', 'cta_text', 'cta_url'].forEach(function (name) {
      values[name] = String(editor.querySelector('[data-slide-field="' + name + '"]').value || '').trim();
    });
    return values;
  }

  function renderSitePages(data) {
    sitePages = data;
    var form = document.getElementById('sitePageForm');
    var select = form.elements.slug;
    var list = document.getElementById('sitePageList');
    var names = {
      'car-wash': 'Car Wash',
      'home-cleaning': 'Home Cleaning',
      gardening: 'Gardening',
      'sneaker-cleaning': 'Sneaker Cleaning',
      about: 'About Us'
    };
    var selectedSlug = select.value || 'car-wash';
    select.replaceChildren();
    Object.keys(names).forEach(function (slug) {
      select.add(new Option(names[slug], slug));
    });
    select.value = selectedSlug in names ? selectedSlug : 'car-wash';

    list.replaceChildren();
    data.forEach(function (page) {
      var item = make('article', undefined, 'item');
      var previews = [];
      if (isSafeImageUrl(page.hero_image_url)) {
        previews.push({ url: page.hero_image_url, kind: 'primary' });
      }
      (page.hero_slides || []).forEach(function (slide, index) {
        if (slide && isSafeImageUrl(slide.image_url)) {
          previews.push({ url: slide.image_url, kind: 'slide', index: index });
        }
      });
      if (previews.length) {
        var imageList = make('div', undefined, 'page-hero-images');
        previews.forEach(function (preview, index) {
          var imageWrapper = make('div', undefined, 'page-hero-image');
          var image = make('img');
          image.src = preview.url;
          image.alt = names[page.slug] + ' hero image ' + (index + 1);
          imageWrapper.appendChild(image);
          var removeButton = make('button', '×', 'page-hero-image-remove');
          removeButton.type = 'button';
          removeButton.setAttribute('aria-label', 'Delete ' + names[page.slug] + ' hero image ' + (index + 1));
          removeButton.addEventListener('click', function () {
            deleteHeroImage(page, preview);
          });
          imageWrapper.appendChild(removeButton);
          imageList.appendChild(imageWrapper);
        });
        item.appendChild(imageList);
      }
      var main = make('div', undefined, 'item-main');
      main.appendChild(make('div', names[page.slug] || page.slug, 'item-title'));
      main.appendChild(make('small', previews.length + ' hero image(s) · ' +
        (page.hero_cta_text || 'No call-to-action text set'), 'muted'));
      item.appendChild(main);
      var actions = make('div', undefined, 'item-actions');
      actions.appendChild(actionButton('Edit', function () {
        select.value = page.slug;
        editSitePage(form, page);
      }, false));
      item.appendChild(actions);
      list.appendChild(item);
    });

    var selectedPage = data.find(function (page) { return page.slug === select.value; });
    if (selectedPage) editSitePage(form, selectedPage);
    renderPageServices();
  }

  function renderPageServices() {
    var form = document.getElementById('pageServiceForm');
    var list = document.getElementById('pageServiceList');
    var pageSlug = form.elements.page_slug.value;
    var page = sitePages.find(function (item) { return item.slug === pageSlug; });
    list.replaceChildren();
    if (!page) {
      list.appendChild(make('p', 'This page is not available in the website pages table.', 'muted'));
      return;
    }

    (page.services || []).forEach(function (service, index) {
      var preview = isSafeImageUrl(service.image_url) ? make('img') : null;
      if (preview) {
        preview.src = service.image_url;
        preview.alt = service.title || 'Service image';
      }
      card(list, service.title || 'Untitled service',
        [service.price_label, (service.features || []).length + ' features'].filter(Boolean).join(' · '),
        function () {
          form.reset();
          form.elements.page_slug.value = pageSlug;
          form.elements.service_index.value = String(index);
          form.elements.title.value = service.title || '';
          form.elements.description.value = service.description || '';
          form.elements.price_label.value = service.price_label || '';
          form.elements.image_url.value = service.image_url || '';
          form.elements.storage_path.value = service.storage_path || '';
          form.elements.features.value = (service.features || []).join('\n');
          form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
        function () {
          if (!window.confirm('Delete this service card from the published page?')) return;
          var nextServices = (page.services || []).slice();
          nextServices.splice(index, 1);
          call(client.from('site_pages').update({ services: nextServices })
            .eq('slug', page.slug).select().single()).then(function () {
            return removeUnreferencedServiceImage(service, page.slug, nextServices);
          }).catch(function (error) {
            return refresh().then(function () { throw error; });
          }).then(function () {
            return refreshThenMessage('Service card deleted.');
          }).catch(showError);
        }, preview);
    });
    if (!(page.services || []).length) {
      list.appendChild(make('p', 'No service cards yet. Add one using the form.', 'muted'));
    }
  }

  function removeUnreferencedServiceImage(service, pageSlug, nextServices) {
    var imageUrl = service && service.image_url;
    var storagePath = service && (service.storage_path || serviceStoragePath(imageUrl) || heroStoragePath(imageUrl));
    if (!imageUrl || !storagePath) return Promise.resolve();
    var referencedUrls = sitePages.reduce(function (urls, page) {
      var services = page.slug === pageSlug ? nextServices : (page.services || []);
      return urls.concat(
        [page.hero_image_url],
        (page.hero_slides || []).map(function (slide) { return slide && slide.image_url; }),
        services.map(function (item) { return item && item.image_url; })
      );
    }, []);
    return referencedUrls.indexOf(imageUrl) === -1
      ? removeStoragePaths([storagePath])
      : Promise.resolve();
  }

  function savePageService(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var pageSlug = form.elements.page_slug.value;
    var page = sitePages.find(function (item) { return item.slug === pageSlug; });
    if (!page) {
      showError(new Error('Choose a website page before saving a service.'));
      return;
    }

    var file = getFormFile(form, 'image_file');
    if (file && file.type.indexOf('image/') !== 0) {
      showError(new Error('Choose a supported image file for the service.'));
      return;
    }
    var title = String(form.elements.title.value || '').trim();
    var imageUrl = String(form.elements.image_url.value || '').trim();
    if (!title) {
      showError(new Error('Enter a service title.'));
      return;
    }
    if (!file && imageUrl && !isSafeImageUrl(imageUrl)) {
      showError(new Error('Enter a full image URL or a path starting with /.'));
      return;
    }

    var rawIndex = form.elements.service_index.value;
    var index = rawIndex === '' ? -1 : Number(rawIndex);
    if (rawIndex !== '' && (!Number.isInteger(index) || index < 0)) {
      showError(new Error('Choose a valid service card to edit.'));
      return;
    }
    var oldService = index >= 0 ? (page.services || [])[index] : null;
    if (index >= 0 && !oldService) {
      showError(new Error('This service card has changed. Refresh the dashboard and try again.'));
      return;
    }
    message(dashboardStatus, 'Saving service card…');
    var uploadedPaths = [];
    var nextServices;
    var nextService;
    var persisted = false;
    var upload = file ? uploadFiles([file], 'services/' + pageSlug) : Promise.resolve([]);
    upload.then(function (uploads) {
      uploadedPaths = uploads.map(function (item) { return item.path; });
      nextService = Object.assign({}, oldService || {}, {
        title: title,
        description: String(form.elements.description.value || '').trim(),
        price_label: String(form.elements.price_label.value || '').trim(),
        image_url: uploads.length ? uploads[0].url : imageUrl,
        storage_path: uploads.length
          ? uploads[0].path
          : (imageUrl === (oldService && oldService.image_url)
            ? (oldService.storage_path || serviceStoragePath(imageUrl) || null)
            : (serviceStoragePath(imageUrl) || null)),
        features: lines(form.elements.features.value)
      });
      nextServices = (page.services || []).slice();
      if (index < 0) nextServices.push(nextService);
      else nextServices[index] = nextService;
      return call(client.from('site_pages').update({ services: nextServices })
        .eq('slug', pageSlug).select().single()).then(function (record) {
        persisted = true;
        return record;
      });
    }).then(function () {
      return oldService
        ? removeUnreferencedServiceImage(oldService, pageSlug, nextServices)
        : Promise.resolve();
    }).then(function () {
      form.reset();
      form.elements.page_slug.value = pageSlug;
      return refresh();
    }).then(function (refreshed) {
      if (refreshed) message(dashboardStatus, 'Service card saved.');
    }).catch(function (error) {
      if (!persisted && uploadedPaths.length) {
        removeStoragePaths(uploadedPaths).then(function () {
          showError(error);
        }).catch(function (cleanupError) {
          console.error('Unable to clean up service images from the failed save:', cleanupError);
          showError(new Error((error.message || 'The save failed.') + ' Uploaded images could not be removed.'));
        });
        return;
      }
      if (persisted) {
        refresh().then(function () { showError(error); }).catch(function (refreshError) {
          console.error('Unable to refresh after saving a service card:', refreshError);
          showError(error);
        });
        return;
      }
      showError(error);
    });
  }

  function serviceStoragePath(url) {
    try {
      var imageUrl = new URL(url);
      var projectUrl = new URL(config.url);
      var prefix = '/storage/v1/object/public/cleansmith-work/services/';
      if (imageUrl.origin !== projectUrl.origin || imageUrl.pathname.indexOf(prefix) !== 0) return '';
      var filePath = decodeURIComponent(imageUrl.pathname.slice(prefix.length));
      return filePath ? 'services/' + filePath : '';
    } catch (error) {
      return '';
    }
  }

  function deleteHeroImage(page, preview) {
    if (!window.confirm('Delete this hero image? The uploaded file will also be removed if no other page uses it.')) return;
    var nextHeroUrl = page.hero_image_url || '';
    var nextSlides = (page.hero_slides || []).slice();
    if (preview.kind === 'primary') {
      nextHeroUrl = '';
    } else {
      nextSlides.splice(preview.index, 1);
    }

    call(client.from('site_pages').update({
      hero_image_url: nextHeroUrl,
      hero_slides: nextSlides
    }).eq('slug', page.slug).select().single()).then(function () {
      var referencedUrls = sitePages.filter(function (item) {
        return item.slug !== page.slug;
      }).reduce(function (urls, item) {
        return urls.concat(
          [item.hero_image_url],
          (item.hero_slides || []).map(function (slide) { return slide && slide.image_url; }),
          (item.services || []).map(function (service) { return service && service.image_url; })
        );
      }, []).concat(
        [nextHeroUrl],
        nextSlides.map(function (slide) { return slide && slide.image_url; }),
        (page.services || []).map(function (service) { return service && service.image_url; })
      );
      var storagePath = heroStoragePath(preview.url);
      var cleanup = storagePath && referencedUrls.indexOf(preview.url) === -1
        ? removeStoragePaths([storagePath])
        : Promise.resolve();
      return cleanup.then(function () {
        return refresh();
      }, function (error) {
        return refresh().then(function () { throw error; });
      });
    }).then(function (refreshed) {
      if (refreshed) message(dashboardStatus, 'Hero image deleted.');
    }).catch(showError);
  }

  function renderPlans(data) {
    var list = document.getElementById('planList');
    list.replaceChildren();
    data.forEach(function (plan) {
      card(list, plan.name + ' — R' + Number(plan.price).toLocaleString('en-ZA') + ' / ' + plan.billing_interval,
        (plan.is_active ? 'Visible' : 'Hidden') + ' · ' + (plan.benefits || []).length + ' benefits',
        function () {
          editForm(document.getElementById('planForm'), plan, {
            benefits: function (items) { return (items || []).join('\n'); },
            is_active: String,
            sort_order: String
          });
        },
        function () {
          if (!window.confirm('Delete this membership plan? Member records will be kept without a plan.')) return;
          remove('membership_plans', plan.id).then(function () {
            return refreshThenMessage('Membership plan deleted.');
          }).catch(showError);
        });
    });
  }

  function renderBookingAddons(data) {
    var list = document.getElementById('bookingAddonList');
    list.replaceChildren();
    data.forEach(function (service) {
      card(list, service.name + ' — R' + Number(service.price).toLocaleString('en-ZA'),
        (service.is_active ? 'Visible' : 'Hidden') + ' · ' + service.slug,
        function () {
          editForm(document.getElementById('bookingAddonForm'), service, {
            is_active: String,
            sort_order: String
          });
        },
        function () {
          if (!window.confirm('Delete this booking add-on service?')) return;
          remove('booking_addons', service.id).then(function () {
            return refreshThenMessage('Service deleted.');
          }).catch(showError);
        });
    });
  }

  function renderTeam(data) {
    var list = document.getElementById('teamList');
    list.replaceChildren();
    data.forEach(function (member) {
      var preview = member.image_url ? make('img') : null;
      if (preview) {
        preview.src = member.image_url;
        preview.alt = member.name;
      }
      card(list, member.name, [member.role, member.is_active ? 'Visible' : 'Hidden'].filter(Boolean).join(' · '),
        function () {
          editForm(document.getElementById('teamForm'), member, {
            is_active: String,
            sort_order: String
          });
        },
        function () {
          if (!window.confirm('Delete this team profile?')) return;
          remove('team_members', member.id).then(function () {
            if (member.storage_path) {
              return call(client.storage.from('cleansmith-work').remove([member.storage_path]));
            }
          }).then(function () {
            return refreshThenMessage('Team profile deleted.');
          }).catch(showError);
        }, preview);
    });
  }

  function renderGallery(data) {
    var list = document.getElementById('galleryList');
    list.replaceChildren();
    if (!data.length) {
      list.appendChild(make('p', 'No work media yet. Uploaded images and videos will appear here.', 'muted'));
      return;
    }
    var serviceNames = {
      'car-wash': 'Car wash',
      'home-cleaning': 'Home cleaning',
      gardening: 'Gardening'
    };
    data.forEach(function (work) {
      var preview;
      if (work.media_type === 'before_after') {
        preview = make('div', undefined, 'gallery-pair-preview');
        [work.before_media_url, work.after_media_url].forEach(function (url, index) {
          var image = make('img');
          image.src = url || '';
          image.alt = index ? 'After' : 'Before';
          preview.appendChild(image);
        });
      } else {
        preview = work.media_type === 'video' ? make('video') : make('img');
        preview.src = work.media_url;
      }
      if (work.media_type === 'video') {
        preview.muted = true;
        preview.playsInline = true;
      } else if (work.media_type !== 'before_after') {
        preview.alt = work.alt_text || work.title;
      }
      card(list, work.title, (serviceNames[work.service_slug] || 'Car wash') + ' · ' +
        (work.is_published ? 'Published' : 'Hidden') + ' · ' +
        (work.media_type === 'before_after' ? 'Before & after' : work.media_type),
        function () {
          var form = document.getElementById('galleryForm');
          editForm(form, work, { is_published: String, sort_order: String });
          updateGalleryMediaFields(form);
        },
        function () {
          if (!window.confirm('Delete this gallery item?')) return;
          remove('work_gallery', work.id).then(function () {
            return removeStoragePaths([
              work.storage_path,
              work.before_storage_path,
              work.after_storage_path
            ]);
          }).then(function () {
            return refreshThenMessage('Gallery item deleted.');
          }).catch(showError);
        }, preview);
    });
  }

  function refresh() {
    var sections = [
      { label: 'packages', table: 'packages', column: 'sort_order', render: renderPackages },
      { label: 'website pages', table: 'site_pages', column: 'sort_order', render: renderSitePages },
      { label: 'membership plans', table: 'membership_plans', column: 'sort_order', render: renderPlans },
      { label: 'booking add-on services', table: 'booking_addons', column: 'sort_order', render: renderBookingAddons },
      { label: 'work gallery', table: 'work_gallery', column: 'sort_order', render: renderGallery },
      { label: 'team profiles', table: 'team_members', column: 'sort_order', render: renderTeam }
    ];
    return Promise.all(sections.map(function (section) {
      return rows(section.table, section.column).then(function (data) {
        return { data: data };
      }).catch(function (error) {
        console.error('Unable to load CLEANSMITH ' + section.label + ':', error);
        return { error: true };
      });
    })).then(function (results) {
      var failedSections = [];
      results.forEach(function (result, index) {
        if (result.error) {
          failedSections.push(sections[index].label);
          return;
        }
        sections[index].render(result.data);
      });
      if (failedSections.length) {
        message(dashboardStatus, 'Unable to load: ' + failedSections.join(', ') + '. Check the database setup and permissions.', true);
        return false;
      }
      return true;
    });
  }

  function refreshThenMessage(successMessage) {
    return refresh().then(function (refreshed) {
      if (refreshed) message(dashboardStatus, successMessage);
    });
  }

  function showError(error) {
    console.error('CLEANSMITH admin operation failed:', error);
    message(dashboardStatus, error && error.message ? error.message : 'The request failed. Please try again.', true);
  }

  function connectForm(formId, table, prepare, afterSave) {
    var form = document.getElementById(formId);
    form.addEventListener('reset', function () {
      window.setTimeout(function () { form.elements.id.value = ''; }, 0);
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      message(dashboardStatus, 'Saving…');
      try {
        var raw = formValues(form);
        var id = raw.id;
        var selectedPageSlug = formId === 'sitePageForm' ? raw.slug : '';
        delete raw.id;
        var prepared;
        var uploadedPaths = [];
        var persisted = false;
        Promise.resolve(prepare(raw, form)).then(function (values) {
          prepared = values;
          uploadedPaths = values._uploaded_paths || [];
          delete values._uploaded_paths;
          return save(table, id, values);
        }).then(function (record) {
          persisted = true;
          if (afterSave) return afterSave(record, raw, prepared);
        }).then(function () {
          resetForm(form);
          if (selectedPageSlug) form.elements.slug.value = selectedPageSlug;
          return refresh();
        }).then(function (refreshed) {
          if (refreshed) message(dashboardStatus, 'Saved successfully.');
        }).catch(function (error) {
          if (!persisted && uploadedPaths.length) {
            removeStoragePaths(uploadedPaths)
              .then(function () { showError(error); })
              .catch(function (cleanupError) {
                console.error('Unable to clean up files from the failed save:', cleanupError);
                showError(new Error((error.message || 'The save failed.') + ' Uploaded files could not be removed.'));
              });
            return;
          }
          showError(error);
        });
      } catch (error) {
        showError(error);
      }
    });
  }

  function publicUrl(path) {
    return client.storage.from('cleansmith-work').getPublicUrl(path).data.publicUrl;
  }

  function getFormFile(form, name) {
    var control = form && form.elements && form.elements.namedItem(name);
    return control && control.files && control.files.length ? control.files[0] : null;
  }

  function getFormFiles(form, name) {
    var control = form && form.elements && form.elements.namedItem(name);
    return control && control.files ? Array.prototype.slice.call(control.files) : [];
  }

  function removeStoragePaths(paths) {
    var uniquePaths = Array.from(new Set((paths || []).filter(Boolean)));
    if (!uniquePaths.length) return Promise.resolve();
    return call(client.storage.from('cleansmith-work').remove(uniquePaths));
  }

  function uploadFiles(files, folder) {
    var uploaded = [];
    return files.reduce(function (promise, file) {
      return promise.then(function () {
        if (file.size > 104857600) throw new Error('Files must be 100 MB or smaller.');
        var name = String(file.name || 'upload').replace(/[^a-zA-Z0-9._-]/g, '-');
        var path = folder + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '-' + name;
        return call(client.storage.from('cleansmith-work').upload(path, file, { upsert: false })).then(function () {
          uploaded.push({ path: path, url: publicUrl(path) });
        });
      });
    }, Promise.resolve()).then(function () {
      return uploaded;
    }).catch(function (error) {
      if (!uploaded.length) throw error;
      return removeStoragePaths(uploaded.map(function (item) { return item.path; })).then(function () {
        throw error;
      }, function (cleanupError) {
        throw new Error((error.message || 'The upload failed.') + ' Some uploaded files could not be removed: ' +
          (cleanupError.message || 'storage cleanup failed.'));
      });
    });
  }

  function uploadTeamPhoto(values, form) {
    var file = getFormFile(form, 'image_file');
    if (file && file.type.indexOf('image/') !== 0) {
      throw new Error('Choose a supported image file for the team photo.');
    }
    delete values.image_file;
    values.sort_order = number(values.sort_order);
    values.is_active = values.is_active === 'true';
    if (!file && !values.image_url) throw new Error('Upload a team photo before saving this profile.');
    return (file ? uploadFiles([file], 'team') : Promise.resolve([])).then(function (uploads) {
      if (uploads.length) {
        values.storage_path = uploads[0].path;
        values.image_url = uploads[0].url;
        values._uploaded_paths = [uploads[0].path];
      }
      if (!values.image_url) throw new Error('Upload a team photo before saving this profile.');
      delete values.id;
      return values;
    });
  }

  function uploadWork(form, values) {
    var type = values.media_type || 'image';
    var uploadedPaths = [];
    delete values.media_file;
    delete values.before_file;
    delete values.after_file;

    if (type === 'before_after') {
      var beforeFile = getFormFile(form, 'before_file');
      var afterFile = getFormFile(form, 'after_file');
      if (!beforeFile && !values.before_media_url) throw new Error('Upload a before image.');
      if (!afterFile && !values.after_media_url) throw new Error('Upload an after image.');
      [beforeFile, afterFile].filter(Boolean).forEach(function (file) {
        if (file.type.indexOf('image/') !== 0) throw new Error('Before-and-after comparisons only support images.');
      });
      var tasks = [];
      if (beforeFile) tasks.push(function () {
        return uploadFiles([beforeFile], 'gallery/before').then(function (uploads) {
          values.before_media_url = uploads[0].url;
          values.before_storage_path = uploads[0].path;
          uploadedPaths.push(uploads[0].path);
        });
      });
      if (afterFile) tasks.push(function () {
        return uploadFiles([afterFile], 'gallery/after').then(function (uploads) {
          values.after_media_url = uploads[0].url;
          values.after_storage_path = uploads[0].path;
          uploadedPaths.push(uploads[0].path);
        });
      });
      return tasks.reduce(function (promise, task) {
        return promise.then(task);
      }, Promise.resolve()).catch(function (error) {
        return removeStoragePaths(uploadedPaths).then(function () {
          throw error;
        });
      }).then(function () {
        values.media_url = values.before_media_url;
        values.media_type = 'before_after';
        values.storage_path = null;
        values._uploaded_paths = uploadedPaths;
        delete values.id;
        return values;
      });
    }

    var file = getFormFile(form, 'media_file');
    if (type !== 'image' && type !== 'video') throw new Error('Choose a valid gallery type.');
    if (file) {
      var actualType = file.type.indexOf('video/') === 0 ? 'video' : file.type.indexOf('image/') === 0 ? 'image' : '';
      if (!actualType) throw new Error('Choose a supported image or video file.');
      if (actualType !== type) throw new Error('The selected file does not match the gallery type.');
    } else if (!values.media_url) {
      throw new Error('Select an image or video file to upload.');
    }
    values.before_media_url = null;
    values.after_media_url = null;
    values.before_storage_path = null;
    values.after_storage_path = null;
    var upload = file ? uploadFiles([file], 'gallery') : Promise.resolve([]);
    return upload.then(function (uploads) {
      if (uploads.length) {
        values.storage_path = uploads[0].path;
        values.media_url = uploads[0].url;
        values._uploaded_paths = [uploads[0].path];
      }
      values.media_type = type;
      delete values.id;
      return values;
    });
  }

  function updateGalleryMediaFields(form) {
    var isBeforeAfter = form.elements.media_type.value === 'before_after';
    form.querySelector('[data-gallery-single-file]').hidden = isBeforeAfter;
    form.querySelector('[data-gallery-before-file]').hidden = !isBeforeAfter;
    form.querySelector('[data-gallery-after-file]').hidden = !isBeforeAfter;
  }

  function prepareSitePage(values, form) {
    var primaryFile = getFormFile(form, 'hero_image_file');
    delete values.hero_image_file;
    delete values.current_hero_image_url;
    values.hero_image_url = String(values.hero_image_url || '').trim();
    values.hero_cta_text = String(values.hero_cta_text || '').trim();
    if (primaryFile && primaryFile.type.indexOf('image/') !== 0) {
      throw new Error('Choose a supported image file for the hero image.');
    }
    if (!primaryFile && values.hero_image_url && !isSafeImageUrl(values.hero_image_url)) {
      throw new Error('Enter a full image URL or a path starting with /.');
    }

    var uploads = primaryFile ? [primaryFile] : [];
    var slideUploadIndexes = [];
    values.hero_slides = Array.prototype.slice.call(form.querySelectorAll('[data-hero-slide]')).map(function (editor) {
      var slide = heroSlideValues(editor);
      var imageInput = editor.querySelector('[data-slide-field="image_file"]');
      var videoInput = editor.querySelector('[data-slide-field="video_file"]');
      var imageFile = imageInput.files && imageInput.files.length ? imageInput.files[0] : null;
      var videoFile = videoInput.files && videoInput.files.length ? videoInput.files[0] : null;
      if (imageFile && imageFile.type.indexOf('image/') !== 0) {
        throw new Error('Choose a supported image file for each hero slide.');
      }
      if (videoFile && !/^video\/(mp4|webm)$/i.test(videoFile.type)) {
        throw new Error('Hero clips must be MP4 or WebM videos.');
      }
      if (videoFile && videoFile.size > 25 * 1024 * 1024) {
        throw new Error('Hero clips must be 25 MB or smaller.');
      }
      if (videoFile && slide.video_url) {
        throw new Error('Choose either a video URL or a video upload for each slide.');
      }
      if (imageFile && slide.image_url) {
        throw new Error('Choose either an image URL or an image upload for each slide.');
      }
      if (slide.image_url && !isSafeImageUrl(slide.image_url)) {
        throw new Error('Enter a full image URL or a path starting with /.');
      }
      if (slide.video_url && !isSafeMediaUrl(slide.video_url)) {
        throw new Error('Enter a full video URL or a path starting with /.');
      }
      if (imageFile && videoFile) {
        throw new Error('Choose one hero media file per slide.');
      }
      if (!imageFile && !slide.image_url && !videoFile && !slide.video_url) {
        throw new Error('Each hero slide needs an image or a video.');
      }
      var indexes = { image: -1, video: -1 };
      if (imageFile) {
        indexes.image = uploads.length;
        uploads.push(imageFile);
      }
      if (videoFile) {
        indexes.video = uploads.length;
        uploads.push(videoFile);
      }
      slideUploadIndexes.push(indexes);
      return slide;
    });
    if (!uploads.length) return values;
    return uploadFiles(uploads, 'hero').then(function (uploaded) {
      if (primaryFile) values.hero_image_url = uploaded[0].url;
      values.hero_slides.forEach(function (slide, index) {
        var uploadIndexes = slideUploadIndexes[index];
        if (uploadIndexes.image >= 0) slide.image_url = uploaded[uploadIndexes.image].url;
        if (uploadIndexes.video >= 0) slide.video_url = uploaded[uploadIndexes.video].url;
      });
      values._uploaded_paths = uploaded.map(function (item) { return item.path; });
      return values;
    });
  }

  function heroStoragePath(url) {
    try {
      var imageUrl = new URL(url);
      var projectUrl = new URL(config.url);
      var prefix = '/storage/v1/object/public/cleansmith-work/hero/';
      if (imageUrl.origin !== projectUrl.origin || imageUrl.pathname.indexOf(prefix) !== 0) return '';
      var filePath = decodeURIComponent(imageUrl.pathname.slice(prefix.length));
      return filePath ? 'hero/' + filePath : '';
    } catch (error) {
      return '';
    }
  }

  function cleanupReplacedHeroImage(record, previous, saved) {
    var oldUrls = [previous.current_hero_image_url];
    var oldPage = sitePages.find(function (page) { return page.slug === saved.slug; });
    oldUrls = oldUrls.concat((oldPage && oldPage.hero_slides || []).map(function (slide) {
      return slide && slide.image_url;
    }));
    oldUrls = oldUrls.concat((oldPage && oldPage.hero_slides || []).map(function (slide) {
      return slide && slide.video_url;
    }));
    var currentUrls = [saved.hero_image_url].concat((saved.hero_slides || []).map(function (slide) {
      return slide.image_url;
    })).concat((saved.hero_slides || []).map(function (slide) {
      return slide.video_url;
    })).concat((saved.services || []).map(function (service) { return service.image_url; }));
    var currentPaths = currentUrls.map(heroStoragePath);
    var pathsToRemove = oldUrls.map(heroStoragePath).filter(function (path) {
      return path && currentPaths.indexOf(path) === -1;
    });
    return removeStoragePaths(pathsToRemove);
  }

  function cleanupReplacedGalleryFiles(record, previous, saved) {
    var oldPaths = [previous.storage_path, previous.before_storage_path, previous.after_storage_path];
    var savedPaths = [saved.storage_path, saved.before_storage_path, saved.after_storage_path];
    return removeStoragePaths(oldPaths.filter(function (path) {
      return path && savedPaths.indexOf(path) === -1;
    }));
  }

  function setupDashboard() {
    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(function (item) {
          item.classList.toggle('active', item === tab);
        });
        document.querySelectorAll('[data-section]').forEach(function (section) {
          section.hidden = section.dataset.section !== tab.dataset.tab;
        });
        message(dashboardStatus, '');
      });
    });

    connectForm('packageForm', 'packages', function (values) {
      values.starting_price = number(values.starting_price);
      values.sort_order = number(values.sort_order);
      values.features = lines(values.features);
      values.vehicle_prices = values.service_slug === 'car-wash' ? {
          hatch: number(values.price_hatch),
          sedan: number(values.price_sedan),
          suv: number(values.price_suv),
          luxury: number(values.price_luxury),
          minibus: number(values.price_minibus)
        } : {};
      delete values.price_hatch;
      delete values.price_sedan;
      delete values.price_suv;
      delete values.price_luxury;
      delete values.price_minibus;
      values.is_active = values.is_active === 'true';
      return values;
    });
    var packageForm = document.getElementById('packageForm');
    packageForm.elements.service_slug.addEventListener('change', function () {
      updateVehiclePriceFields(packageForm);
    });
    packageForm.addEventListener('reset', function () {
      window.setTimeout(function () { updateVehiclePriceFields(packageForm); }, 0);
    });
    updateVehiclePriceFields(packageForm);
    connectForm('sitePageForm', 'site_pages', prepareSitePage, cleanupReplacedHeroImage);
    var sitePageForm = document.getElementById('sitePageForm');
    var heroImageUrl = sitePageForm.elements.hero_image_url;
    var heroImageFile = sitePageForm.elements.hero_image_file;
    document.getElementById('addHeroSlide').addEventListener('click', function () {
      var list = sitePageForm.querySelector('#heroSlides');
      appendHeroSlideEditor(list, {}, list.querySelectorAll('[data-hero-slide]').length);
      updateHeroSlideNumbers(list);
      list.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    sitePageForm.addEventListener('reset', function () {
      window.setTimeout(function () { renderHeroSlideEditors(sitePageForm, []); }, 0);
    });
    heroImageUrl.addEventListener('input', function () {
      if (heroImageUrl.value) heroImageFile.value = '';
    });
    heroImageFile.addEventListener('change', function () {
      if (getFormFile(sitePageForm, 'hero_image_file')) heroImageUrl.value = '';
    });
    sitePageForm.elements.slug.addEventListener('change', function (event) {
      var page = sitePages.find(function (item) { return item.slug === event.currentTarget.value; });
      if (page) editSitePage(event.currentTarget.form, page);
      else {
        var slug = event.currentTarget.value;
        event.currentTarget.form.reset();
        event.currentTarget.form.elements.slug.value = slug;
        event.currentTarget.form.elements.id.value = '';
        renderHeroSlideEditors(event.currentTarget.form, []);
      }
    });
    var pageServiceForm = document.getElementById('pageServiceForm');
    pageServiceForm.addEventListener('submit', savePageService);
    pageServiceForm.elements.page_slug.addEventListener('change', function (event) {
      var pageSlug = event.currentTarget.value;
      pageServiceForm.reset();
      pageServiceForm.elements.page_slug.value = pageSlug;
      renderPageServices();
    });
    pageServiceForm.elements.image_url.addEventListener('input', function () {
      if (pageServiceForm.elements.image_url.value) pageServiceForm.elements.image_file.value = '';
    });
    pageServiceForm.elements.image_file.addEventListener('change', function () {
      if (getFormFile(pageServiceForm, 'image_file')) pageServiceForm.elements.image_url.value = '';
    });
    pageServiceForm.addEventListener('reset', function () {
      var pageSlug = pageServiceForm.elements.page_slug.value;
      window.setTimeout(function () {
        pageServiceForm.elements.page_slug.value = pageSlug;
      }, 0);
    });
    connectForm('planForm', 'membership_plans', function (values) {
      values.price = number(values.price);
      values.discount_percent = number(values.discount_percent);
      values.sort_order = number(values.sort_order);
      values.benefits = lines(values.benefits);
      values.is_active = values.is_active === 'true';
      return values;
    });
    connectForm('bookingAddonForm', 'booking_addons', function (values) {
      values.price = number(values.price);
      values.sort_order = number(values.sort_order);
      values.is_active = values.is_active === 'true';
      return values;
    });
    connectForm('teamForm', 'team_members', uploadTeamPhoto, function (record, previous, saved) {
      if (previous.storage_path && previous.storage_path !== saved.storage_path) {
        return removeStoragePaths([previous.storage_path]);
      }
    });
    connectForm('galleryForm', 'work_gallery', function (values, form) {
      values.sort_order = number(values.sort_order);
      values.is_published = values.is_published === 'true';
      return uploadWork(form, values);
    }, cleanupReplacedGalleryFiles);
    var galleryForm = document.getElementById('galleryForm');
    galleryForm.elements.media_type.addEventListener('change', function () {
      updateGalleryMediaFields(galleryForm);
    });
    galleryForm.addEventListener('reset', function () {
      window.setTimeout(function () { updateGalleryMediaFields(galleryForm); }, 0);
    });
    updateGalleryMediaFields(galleryForm);

    document.getElementById('signOut').addEventListener('click', function () {
      client.auth.signOut().then(function (response) {
        if (response.error) throw response.error;
        dashboard.hidden = true;
        loginPanel.hidden = false;
        message(loginStatus, 'You have signed out.');
      }).catch(function (error) {
        console.error('Unable to sign out:', error);
        message(dashboardStatus, error.message || 'Unable to sign out.', true);
      });
    });
  }

  function enterDashboard(session) {
    return call(client.rpc('is_cleansmith_admin')).then(function (isAdmin) {
      if (!isAdmin) {
        return client.auth.signOut().then(function () {
          throw new Error('This account does not have the admin role. Ask the project owner to grant app_metadata.role = admin.');
        });
      }
      document.getElementById('userEmail').textContent = session.user.email || '';
      loginPanel.hidden = true;
      dashboard.hidden = false;
      return refresh();
    });
  }

  if (!configured()) {
    message(loginStatus, 'Configure the Supabase project URL and anon key in supabase-config.js to enable admin sign-in.', true);
    document.getElementById('loginForm').querySelectorAll('input,button').forEach(function (control) {
      control.disabled = true;
    });
    return;
  }

  client = window.CLEANSMITH_SUPABASE_CLIENT ||
    (window.CLEANSMITH_SUPABASE_CLIENT = window.supabase.createClient(config.url, config.anonKey));
  setupDashboard();
  document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    message(loginStatus, 'Signing in…');
    var values = formValues(event.currentTarget);
    client.auth.signInWithPassword({ email: values.email, password: values.password })
      .then(function (result) {
        if (result.error) throw result.error;
        return enterDashboard(result.data.session);
      }).catch(function (error) {
        console.error('CLEANSMITH sign-in failed:', error);
        message(loginStatus, error.message || 'Unable to sign in.', true);
      });
  });
  client.auth.getSession().then(function (result) {
    if (result.error) throw result.error;
    if (result.data.session) return enterDashboard(result.data.session);
  }).catch(function (error) {
    console.error('Unable to restore CLEANSMITH admin session:', error);
    message(loginStatus, error.message || 'Unable to restore the admin session.', true);
  });
  }

  window.CLEANSMITH_ADMIN_INIT = initializeAdmin;
})();
